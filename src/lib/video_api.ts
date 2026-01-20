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

export interface VideoTreeItem extends VideoItem {
  children?: VideoTreeItem[];
  level?: number;
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
    // Use provided baseUrl or construct from API_BASE_URL
    this.baseUrl = baseUrl || `${API_BASE_URL}/videos`;
    console.log("VideoApi initialized with baseUrl:", this.baseUrl);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildUrl(endpoint: string = '', params?: Record<string, any>): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'parent_id' && value === 'null') {
            queryParams.append(key, 'null');
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      console.log(`Making request to: ${url}`, options);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Add Authorization header if token exists
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to get error message from response body
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse JSON response
      const responseData = await response.json();
      console.log("Response data:", responseData);
      
      // Standardize response format
      return this.standardizeResponse<T>(responseData);
      
    } catch (error) {
      console.error('Request failed:', error);
      
      // Return standardized error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: undefined as any,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private standardizeResponse<T>(responseData: any): ApiResponse<T> {
    console.log("Standardizing response:", responseData);
    
    // Case 1: Response already has our ApiResponse structure
    if (responseData.success !== undefined) {
      return responseData as ApiResponse<T>;
    }
    
    // Case 2: Response has 'data' property (common Laravel/API pattern)
    if (responseData.data !== undefined) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message,
        meta: responseData.meta
      };
    }
    
    // Case 3: Response is an array (list of items)
    if (Array.isArray(responseData)) {
      return {
        success: true,
        data: responseData as T
      };
    }
    
    // Case 4: Response is an object (single item)
    if (responseData && typeof responseData === 'object' && Object.keys(responseData).length > 0) {
      return {
        success: true,
        data: responseData as T
      };
    }
    
    // Case 5: Response is empty or invalid
    console.warn("Invalid or empty response format:", responseData);
    return {
      success: false,
      error: "Invalid response format from server",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: undefined as any,
    };
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
    try {
      // Convert parent_id=null to string 'null' for API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiParams: Record<string, any> = {};
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'parent_id' && value === null) {
              apiParams[key] = 'null';
            } else {
              apiParams[key] = value;
            }
          }
        });
      }
      
      const url = this.buildUrl('', apiParams);
      console.log("Fetching videos from URL:", url);
      
      const response = await this.makeRequest<VideoItem[]>(url, {
        method: 'GET',
      });
      
      // Ensure data is always an array
      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        return {
          ...response,
          data: dataArray
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('Error in getVideos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      };
    }
  }
  
  /**
   * Get video by ID
   */
  async getVideoById(id: number): Promise<ApiResponse<VideoItem>> {
    try {
      const url = this.buildUrl(`/${id}`);
      console.log(`Fetching video ${id} from URL:`, url);
      
      const response = await this.makeRequest<VideoItem>(url, {
        method: 'GET',
      });
      
      // If direct endpoint fails, try to get from all videos
      if (!response.success || !response.data) {
        console.log(`Direct endpoint failed for video ${id}, trying fallback...`);
        
        const allVideos = await this.getVideos({ status: 1 });
        if (allVideos.success && allVideos.data) {
          const video = allVideos.data.find(v => v.id === id);
          if (video) {
            return {
              success: true,
              data: video
            };
          }
        }
        
        throw new Error(`Video ${id} not found`);
      }
      
      return response;
      
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video not found',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: undefined as any,
      };
    }
  }
  
  /**
   * Get video tree structure
   */
  async getVideoTree(): Promise<ApiResponse<VideoItem[]>> {
    try {
      // Try specific tree endpoint
      const url = this.buildUrl('/tree');
      console.log("Fetching video tree from URL:", url);
      
      const response = await this.makeRequest<VideoItem[]>(url, {
        method: 'GET',
      });
      
      // If tree endpoint doesn't exist, fallback to get all videos
      if (!response.success) {
        console.log("Tree endpoint failed, falling back to getVideos");
        return await this.getVideos({ status: 1 });
      }
      
      return response;
      
    } catch (error) {
      console.error('Error fetching video tree:', error);
      // Fallback to get all videos
      return await this.getVideos({ status: 1 });
    }
  }
  
  /**
   * Get videos by parent ID
   */
  async getVideosByParentId(parentId: number | null): Promise<ApiResponse<VideoItem[]>> {
    try {
      const params = {
        parent_id: parentId === null ? 'null' : parentId,
        status: 1
      };
      
      const url = this.buildUrl('', params);
      console.log(`Fetching videos by parent ${parentId} from URL:`, url);
      
      const response = await this.makeRequest<VideoItem[]>(url, {
        method: 'GET',
      });
      
      // Ensure data is always an array
      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        return {
          ...response,
          data: dataArray
        };
      }
      
      return response;
      
    } catch (error) {
      console.error(`Error fetching videos by parent ${parentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      };
    }
  }
  
  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = this.baseUrl;
      console.log("Testing API connection to:", url);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error("API connection test failed:", error);
      return false;
    }
  }
}

// Export a default instance
export const videoApi = new VideoApi();

// Export utilities separately
export { videoUtils } from './video_queries';