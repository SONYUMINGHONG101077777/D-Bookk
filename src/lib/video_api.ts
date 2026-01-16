/**
 * Video Item Interface
 */
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

/**
 * Video API Response Interface
 */
export interface VideoApiResponse {
  success: boolean;
  message?: string;
  data?: VideoItem[] | VideoItem;
  error?: string;
  meta?: {
    current_page?: number;
    from?: number;
    last_page?: number;
    per_page?: number;
    to?: number;
    total?: number;
  };
}

/**
 * Video API Query Parameters
 */
export interface VideoQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'sort_order' | 'name_en';
  sort_order?: 'asc' | 'desc';
  company_id?: string;
  status?: number;
  parent_id?: number | null;
  language?: 'en' | 'kh' | 'ch';
}

/**
 * Create Video Request Interface
 */
export interface CreateVideoRequest {
  name_en: string;
  name_kh: string;
  name_ch: string;
  parent_id?: number | null;
  sort_order?: number;
  video_title_en?: string;
  video_title_kh?: string;
  video_title_ch?: string;
  video_url: string;
  video_thumb?: string;
  company_id: string;
  status?: number;
}

/**
 * Update Video Request Interface
 */
export interface UpdateVideoRequest {
  name_en?: string;
  name_kh?: string;
  name_ch?: string;
  parent_id?: number | null;
  sort_order?: number;
  video_title_en?: string;
  video_title_kh?: string;
  video_title_ch?: string;
  video_url?: string;
  video_thumb?: string;
  company_id?: string;
  status?: number;
}

/**
 * Video Tree Structure Interface
 */
export interface VideoTreeItem extends VideoItem {
  children?: VideoTreeItem[];
  level?: number;
}

/**
 * API Configuration
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
const API_VERSION = 'v1';

/**
 * Helper function to build query string
 */
const buildQueryString = (params: VideoQueryParams): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Video API Service
 */
export class VideoApi {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || `${API_BASE_URL}/${API_VERSION}/videos`;
  }
  
  /**
   * Get all videos with optional filtering and pagination
   */
  async getVideos(params?: VideoQueryParams): Promise<VideoApiResponse> {
    try {
      const queryString = params ? buildQueryString(params) : '';
      const response = await fetch(`${this.baseUrl}${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching videos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Get video by ID
   */
  async getVideoById(id: number): Promise<VideoApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Get videos by parent ID (nested structure)
   */
  async getVideosByParentId(parentId: number | null): Promise<VideoApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/parent/${parentId || 'null'}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching videos by parent ${parentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Get complete video tree
   */
  async getVideoTree(): Promise<VideoApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tree`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching video tree:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Create a new video
   */
  async createVideo(videoData: CreateVideoRequest): Promise<VideoApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(videoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating video:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Update an existing video
   */
  async updateVideo(id: number, videoData: UpdateVideoRequest): Promise<VideoApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(videoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating video ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Delete a video
   */
  async deleteVideo(id: number): Promise<VideoApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting video ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Reorder videos
   */
  async reorderVideos(items: { id: number; sort_order: number }[]): Promise<VideoApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ items }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error reordering videos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Get videos by company ID
   */
  async getVideosByCompany(companyId: string, params?: Omit<VideoQueryParams, 'company_id'>): Promise<VideoApiResponse> {
    try {
      const queryParams: VideoQueryParams = {
        ...params,
        company_id: companyId,
      };
      const queryString = buildQueryString(queryParams);
      
      const response = await fetch(`${this.baseUrl}/company/${companyId}${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching videos for company ${companyId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export a default instance
export const videoApi = new VideoApi();