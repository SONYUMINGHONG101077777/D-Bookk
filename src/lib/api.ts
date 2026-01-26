const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://erp.palmtechnology.net/api';


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

export type TContents = {
  thumbnail: string;
  id: number;
  topic_id: number;
  content_en: string;
  content_kh: string;
  content_ch: string;
  created_at: string;
  updated_at: string;
  video_en?: string;
  video_kh?: string;
  video_ch?: string;
  title_en?: string;
  title_kh?: string;
  title_ch?: string;
};

export type TTopics = {
  id: number;
  section_id: number;
  parent_id: number | null;
  title_en: string;
  title_kh: string;
  title_ch: string;
  created_at: string;
  updated_at: string;
  contents?: TContents[];
  children?: TTopics[];
};

export type TBook = {
  id: number;
  title_en: string;
  title_kh: string;
  title_ch: string;
  status: number;
  company_id: string;
  created_at: string;
  updated_at: string;
  topics?: TTopics[];
};

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


export class UnifiedApi {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }
  
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      };
      
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, { 
        ...options, 
        headers,
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.status === 204) {
        return {
          success: true,
          data: undefined as T,
        };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        
        let errorMessage = `HTTP ${response.status}: `;
        switch (response.status) {
          case 401:
            errorMessage += 'Unauthorized - Please check your authentication';
            break;
          case 403:
            errorMessage += 'Forbidden - You don\'t have permission to access this resource';
            break;
          case 404:
            errorMessage += 'Not Found - The requested resource was not found';
            break;
          case 500:
            errorMessage += 'Internal Server Error - Please try again later';
            break;
          default:
            errorMessage += errorText || 'Unknown error';
        }
        
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Non-JSON response from ${url}, content-type: ${contentType}`);
        const text = await response.text();
        
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          try {
            const data = JSON.parse(text);
            return this.normalizeResponse<T>(data);
          } catch {
            // If parsing fails, continue with error
          }
        }
        
        throw new Error(`Expected JSON but got ${contentType}`);
      }
      
      const data = await response.json();
      console.log("API Response data (raw):", data);
    
      return this.normalizeResponse<T>(data);
      
    } catch (error) {
      console.error('Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: undefined as T,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeResponse<T>(data: any): ApiResponse<T> {
    console.log("Normalizing response data:", data);
    
    if (data && typeof data === 'object' && 'success' in data) {
      console.log("Already in ApiResponse format");
      return data as ApiResponse<T>;
    }
    
    if (data && typeof data === 'object' && 'status' in data) {
      console.log("Has status field:", data.status);
      
      if (data.status === 200 || data.status === 'success' || data.status === true) {
        if (data.menu !== undefined && data.menu !== null) {
          console.log("Found menu field:", data.menu);
          console.log("Menu type:", typeof data.menu);
          console.log("Menu is array?", Array.isArray(data.menu));
          console.log("Menu length:", Array.isArray(data.menu) ? data.menu.length : 'N/A');
          
          let extractedData = data.menu;
          
          if (data.menu && typeof data.menu === 'object' && !Array.isArray(data.menu)) {
            if (data.menu.data && Array.isArray(data.menu.data)) {
              extractedData = data.menu.data;
            } 
            else if (data.menu.items && Array.isArray(data.menu.items)) {
              extractedData = data.menu.items;
            }
            else {
              const arrayKeys = Object.keys(data.menu).filter(key => Array.isArray(data.menu[key]));
              if (arrayKeys.length > 0) {
                extractedData = data.menu[arrayKeys[0]];
              }
            }
          }
          
          console.log("Extracted data from menu:", extractedData);
          
          return {
            success: true,
            data: extractedData as T,
            message: data.message,
          };
        }
        
        if (data.data !== undefined) {
          console.log("Found data field:", data.data);
          let extractedData = data.data;
          
          if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            const arrayKeys = Object.keys(data.data).filter(key => Array.isArray(data.data[key]));
            if (arrayKeys.length > 0) {
              extractedData = data.data[arrayKeys[0]];
            }
          }
          
          return {
            success: true,
            data: extractedData as T,
            message: data.message,
          };
        }
        
        console.log("Using data object itself as response");
        return {
          success: true,
          data: data as T,
          message: data.message,
        };
      } else {
        console.log("Error status:", data.status);
        return {
          success: false,
          error: data.message || data.error || 'Unknown error',
          data: undefined as T,
        };
      }
    }
    
    if (data && typeof data === 'object') {
      console.log("Direct object/array data");
      
      if (!Array.isArray(data)) {
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          console.log("Found array key in object:", arrayKeys[0]);
          return {
            success: true,
            data: data[arrayKeys[0]] as T,
          };
        }
      }
      
      return {
        success: true,
        data: data as T,
      };
    }
    
    if (Array.isArray(data)) {
      console.log("Direct array data");
      return {
        success: true,
        data: data as T,
      };
    }
    
    console.log("Fallback for non-object data");
    return {
      success: true,
      data: data as T,
    };
  }

  // ==================== BOOK/HELP CENTER API ====================
  async getHelpCenter(companyId: string = 'PALM-01'): Promise<ApiResponse<TBook[]>> {
    const url = `${this.baseUrl}/get-help_center/${companyId}`;
    console.log("getHelpCenter - Calling:", url);
    const response = await this.makeRequest<TBook[]>(url);
    console.log("getHelpCenter - Response:", response);
    return response;
  }

  async getHelpCenterVideos(companyId: string = 'PALM-01'): Promise<ApiResponse<VideoItem[]>> {
    const url = `${this.baseUrl}/get-help_center_video/${companyId}`;
    console.log("getHelpCenterVideos - Calling:", url);
    const response = await this.makeRequest<VideoItem[]>(url);
    console.log("getHelpCenterVideos - Response:", response);

    if (response.success && response.data) {
      console.log(`getHelpCenterVideos - Found ${response.data.length} videos`);
      if (response.data.length > 0) {
        console.log("First video structure:", response.data[0]);
      }
    } else {
      console.log("getHelpCenterVideos - Error or no data:", response.error);
    }
    
    return response;
  }


  async getBookById(bookId: string | number, companyId: string = 'PALM-01'): Promise<ApiResponse<TBook>> {
    try {
      const response = await this.getHelpCenter(companyId);
      
      if (response.success && response.data) {
        const bookData = Array.isArray(response.data) 
          ? response.data.find((b: TBook) => b.id.toString() === bookId.toString())
          : response.data;
        
        if (bookData) {
          return {
            success: true,
            data: bookData,
            message: 'Book found successfully'
          };
        }
      }
      
      return {
        success: false,
        error: `Book ${bookId} not found in help center`,
      };
      
    } catch (error) {
      console.error('Error fetching book:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch book',
      };
    }
  }

  getChapterContentsFromBook(book: TBook, chapterId: string): TContents[] {
    console.log("Getting contents for chapter", chapterId, "from book:", book);

    if (!book.topics || book.topics.length === 0) {
      console.log("No topics in book");
      return [];
    }

    const findTopicInTree = (topics: TTopics[], targetId: string): TTopics | undefined => {
      for (const topic of topics) {
        if (topic.id.toString() === targetId) {
          return topic;
        }
        if (topic.children && topic.children.length > 0) {
          const found = findTopicInTree(topic.children, targetId);
          if (found) return found;
        }
      }
      return undefined;
    };

    const topic = findTopicInTree(book.topics, chapterId);
    console.log("Found topic:", topic);

    if (topic && topic.contents) {
      console.log("Returning contents:", topic.contents);
      return topic.contents;
    }

    console.log("No contents found for chapter", chapterId);
    return [];
  }

  // ==================== VIDEO API ====================

  async getVideos(params?: {
    language?: string;
    status?: number;
    parent_id?: number | null;
    company_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    endpoint?: 'help_center' | 'help_center_video' | 'auto';
  }): Promise<ApiResponse<VideoItem[]>> {
    const companyId = params?.company_id || 'PALM-01';
    const endpoint = params?.endpoint || 'auto';
    
    console.log("getVideos called with params:", params);
    
    try {
      let response: ApiResponse<VideoItem[]>;
      
      if (endpoint === 'help_center') {
        const bookResponse = await this.getHelpCenter(companyId);
        console.log("getVideos - help_center response:", bookResponse);
        if (bookResponse.success && bookResponse.data) {
          const videos = this.extractVideosFromBooks(bookResponse.data);
          console.log("Extracted videos from books:", videos.length);
          response = {
            success: true,
            data: videos
          };
        } else {
          response = {
            success: false,
            error: bookResponse.error || 'Failed to get help center data',
            data: []
          };
        }
      } else if (endpoint === 'help_center_video') {
        response = await this.getHelpCenterVideos(companyId);
        console.log("getVideos - help_center_video response:", response);
      } else {
        response = await this.getHelpCenterVideos(companyId);
        console.log("Auto - First try (help_center_video):", response);
        
        if (!response.success || !response.data || response.data.length === 0) {
          console.log("Help center videos endpoint returned empty, trying help_center...");
          const bookResponse = await this.getHelpCenter(companyId);
          console.log("Auto - Second try (help_center):", bookResponse);
          
          if (bookResponse.success && bookResponse.data) {
            const videos = this.extractVideosFromBooks(bookResponse.data);
            console.log("Extracted videos from help_center:", videos.length);
            response = {
              success: true,
              data: videos
            };
          } else {
            response = {
              success: false,
              error: bookResponse.error || 'Both endpoints failed',
              data: []
            };
          }
        }
      }
      
      console.log("getVideos final response:", response);
      
      if (response.success && response.data && params) {
        let filteredData = response.data;
        
        console.log("Before filtering:", filteredData.length, "videos");
        
        if (params.status !== undefined) {
          filteredData = filteredData.filter(video => video.status === params.status);
          console.log("After status filter:", filteredData.length, "videos");
        }
        
        if (params.parent_id !== undefined) {
          filteredData = filteredData.filter(video => 
            params.parent_id === null ? video.parent_id === null : video.parent_id === params.parent_id
          );
          console.log("After parent_id filter:", filteredData.length, "videos");
        }
        
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          filteredData = filteredData.filter(video => 
            video.name_en?.toLowerCase().includes(searchLower) ||
            video.name_kh?.toLowerCase().includes(searchLower) ||
            video.name_ch?.toLowerCase().includes(searchLower) ||
            video.video_title_en?.toLowerCase().includes(searchLower) ||
            video.video_title_kh?.toLowerCase().includes(searchLower) ||
            video.video_title_ch?.toLowerCase().includes(searchLower)
          );
          console.log("After search filter:", filteredData.length, "videos");
        }
        
        return {
          ...response,
          data: filteredData
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

 
  private extractVideosFromBooks(books: TBook[]): VideoItem[] {
    const videos: VideoItem[] = [];
    
    books.forEach(book => {
      if (book.topics) {
        this.extractVideosFromTopics(book.topics, videos, book.id);
      }
    });
    
    return videos;
  }

  private extractVideosFromTopics(topics: TTopics[], videos: VideoItem[], bookId: number, parentId: number | null = null): void {
    topics.forEach(topic => {
      if (topic.contents && topic.contents.some(content => 
        content.video_en || content.video_kh || content.video_ch
      )) {
        const videoItem: VideoItem = {
          id: topic.id,
          name_en: topic.title_en,
          name_kh: topic.title_kh,
          name_ch: topic.title_ch,
          parent_id: parentId,
          sort_order: 0,
          video_title_en: topic.title_en,
          video_title_kh: topic.title_kh,
          video_title_ch: topic.title_ch,
          video_url: topic.contents[0]?.video_en || topic.contents[0]?.video_kh || topic.contents[0]?.video_ch || '',
          video_thumb: topic.contents[0]?.thumbnail || '',
          company_id: 'PALM-01', // Default
          status: 1,
          created_at: topic.created_at,
          updated_at: topic.updated_at,
          children_recursive: []
        };
        videos.push(videoItem);
      }
      
      if (topic.children && topic.children.length > 0) {
        this.extractVideosFromTopics(topic.children, videos, bookId, topic.id);
      }
    });
  }

  
  async getVideoById(id: number, endpoint?: 'help_center' | 'help_center_video'): Promise<ApiResponse<VideoItem>> {
    try {
      if (endpoint === 'help_center') {
        const bookResponse = await this.getHelpCenter();
        if (bookResponse.success && bookResponse.data) {
          const videos = this.extractVideosFromBooks(bookResponse.data);
          const video = videos.find(v => v.id === id);
          if (video) {
            return { success: true, data: video };
          }
        }
      } else if (endpoint === 'help_center_video') {
        const videoResponse = await this.getHelpCenterVideos();
        if (videoResponse.success && videoResponse.data) {
          const video = videoResponse.data.find(v => v.id === id);
          if (video) {
            return { success: true, data: video };
          }
        }
      } else {
        const [videoResponse, bookResponse] = await Promise.all([
          this.getHelpCenterVideos(),
          this.getHelpCenter()
        ]);
        
        if (videoResponse.success && videoResponse.data) {
          const video = videoResponse.data.find(v => v.id === id);
          if (video) {
            return { success: true, data: video };
          }
        }
        
        if (bookResponse.success && bookResponse.data) {
          const videos = this.extractVideosFromBooks(bookResponse.data);
          const video = videos.find(v => v.id === id);
          if (video) {
            return { success: true, data: video };
          }
        }
      }
      
      return {
        success: false,
        error: `Video ${id} not found`,
      };
      
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video not found',
      };
    }
  }

 
  async getVideoTree(endpoint?: 'help_center' | 'help_center_video'): Promise<ApiResponse<VideoItem[]>> {
    return this.getVideos({ status: 1, endpoint });
  }

  async getVideosByParentId(parentId: number | null, endpoint?: 'help_center' | 'help_center_video'): Promise<ApiResponse<VideoItem[]>> {
    return this.getVideos({ parent_id: parentId, status: 1, endpoint });
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); 
      
      const [response1, response2] = await Promise.all([
        fetch(`${this.baseUrl}/get-help_center/PALM-01`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
          signal: controller.signal,
        }).catch(() => ({ ok: false })),
        fetch(`${this.baseUrl}/get-help_center_video/PALM-01`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
          signal: controller.signal,
        }).catch(() => ({ ok: false }))
      ]);
      
      clearTimeout(timeoutId);
      return response1.ok || response2.ok;
    } catch {
      return false;
    }
  }
}

export const api = new UnifiedApi();
export const videoApi = api;
export const fetchBookData = async (bookId: string) => {
  const response = await api.getBookById(bookId);
  if (response.success && response.data) {
    return {
      message: "Success",
      data: response.data,
    };
  }
  throw new Error(response.error || `Book ${bookId} not found`);
};

export const getChapterContentsFromBook = (book: TBook, chapterId: string): TContents[] => {
  return api.getChapterContentsFromBook(book, chapterId);
};
