const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://erp.palmtechnology.net/api';

export interface VideoItem {
  id: number;
  name_en: string;
  name_kh: string;
  name_ch: string;
  parent_id: number | null;
  sort_order: number;
  video_title_en: string | null;
  video_title_kh: string | null;
  video_title_ch: string | null;
  video_url: string;
  video_thumb: string;
  company_id: string;
  status: number;
  created_at: string;
  updated_at: string;
  children_recursive?: VideoItem[] | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    current_page?: number;
    from?: number;
    last_page?: number;
    per_page?: number;
    to?: number;
    total?: number;
  };
}

export class VideoApi {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || `${API_BASE_URL}/videos`;
  }
  
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 200 && data.menu) {
        return {
          success: true,
          data: data.menu as T
        };
      }
      
      return {
        success: true,
        data: data as T
      };
      
    } catch (error) {
      console.error('Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: undefined as any,
      };
    }
  }

  async getVideos(params?: {
    language?: string;
    status?: number;
    parent_id?: number | null;
    company_id?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<VideoItem[]>> {
    const urlParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.append(key, String(value));
        }
      });
    }
    
    const url = `${this.baseUrl}${urlParams.toString() ? `?${urlParams}` : ''}`;
    return this.makeRequest<VideoItem[]>(url);
  }
  
  async getVideoById(id: number): Promise<ApiResponse<VideoItem>> {
    const response = await this.getVideos();
    
    if (response.success && response.data) {
      const video = response.data.find(v => v.id === id);
      if (video) {
        return { success: true, data: video };
      }
    }
    
    return {
      success: false,
      error: `Video ${id} not found`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: undefined as any,
    };
  }
  
  async getVideoTree(): Promise<ApiResponse<VideoItem[]>> {
    return this.getVideos({ status: 1 });
  }
  
  async getVideosByParentId(parentId: number | null): Promise<ApiResponse<VideoItem[]>> {
    return this.getVideos({ parent_id: parentId, status: 1 });
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const videoApi = new VideoApi();