import { videoApi, type VideoQueryParams, type VideoItem, type VideoTreeItem } from './video_api';

/**
 * React Query keys for videos
 */
export const videoQueryKeys = {
  all: ['videos'] as const,
  lists: () => [...videoQueryKeys.all, 'list'] as const,
  list: (filters?: VideoQueryParams) => [...videoQueryKeys.lists(), filters] as const,
  details: () => [...videoQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...videoQueryKeys.details(), id] as const,
  tree: () => [...videoQueryKeys.all, 'tree'] as const,
  byParent: (parentId: number | null) => [...videoQueryKeys.all, 'parent', parentId] as const,
  byCompany: (companyId: string, filters?: VideoQueryParams) => 
    [...videoQueryKeys.all, 'company', companyId, filters] as const,
};

/**
 * Video Queries for React Query
 */
export const videoQueries = {
  /**
   * Get all videos with optional filters
   */
  getVideos: (params?: VideoQueryParams) => ({
    queryKey: videoQueryKeys.list(params),
    queryFn: () => videoApi.getVideos(params),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (response: any) => {
      if (response.success && response.data) {
        return {
          ...response,
          data: Array.isArray(response.data) ? response.data : [response.data],
        };
      }
      return response;
    },
  }),
  
  /**
   * Get video by ID
   */
  getVideoById: (id: number) => ({
    queryKey: videoQueryKeys.detail(id),
    queryFn: () => videoApi.getVideoById(id),
  }),
  
  /**
   * Get videos by parent ID
   */
  getVideosByParentId: (parentId: number | null) => ({
    queryKey: videoQueryKeys.byParent(parentId),
    queryFn: () => videoApi.getVideosByParentId(parentId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (response: any) => {
      if (response.success && response.data) {
        return {
          ...response,
          data: Array.isArray(response.data) ? response.data : [response.data],
        };
      }
      return response;
    },
  }),
  
  /**
   * Get complete video tree
   */
  getVideoTree: () => ({
    queryKey: videoQueryKeys.tree(),
    queryFn: () => videoApi.getVideoTree(),
  }),
  
  /**
   * Get videos by company ID
   */
  getVideosByCompany: (companyId: string, params?: Omit<VideoQueryParams, 'company_id'>) => ({
    queryKey: videoQueryKeys.byCompany(companyId, params),
    queryFn: () => videoApi.getVideosByCompany(companyId, params),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (response: any) => {
      if (response.success && response.data) {
        return {
          ...response,
          data: Array.isArray(response.data) ? response.data : [response.data],
        };
      }
      return response;
    },
  }),
};

/**
 * Video Mutations for React Query
 */
export const videoMutations = {
  /**
   * Create video mutation
   */
  createVideo: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (videoData: any) => videoApi.createVideo(videoData),

     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMutate: async (newVideo: any) => {
      return { newVideo };
    },
  }),
  
  /**
   * Update video mutation
   */
  updateVideo: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      videoApi.updateVideo(id, data),
  }),
  
  /**
   * Delete video mutation
   */
  deleteVideo: () => ({
    mutationFn: (id: number) => videoApi.deleteVideo(id),
  }),
  
  /**
   * Reorder videos mutation
   */
  reorderVideos: () => ({
    mutationFn: (items: { id: number; sort_order: number }[]) => 
      videoApi.reorderVideos(items),
  }),
};

/**
 * Utility functions for video data manipulation
 */
export const videoUtils = {
  /**
   * Build nested tree structure from flat array
   */
  buildTree: (items: VideoItem[], parentId: number | null = null): VideoTreeItem[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => ({
        ...item,
        level: parentId === null ? 0 : undefined,
        children: videoUtils.buildTree(items, item.id),
      }));
  },
  
  /**
   * Flatten tree structure to array
   */
  flattenTree: (tree: VideoTreeItem[], level: number = 0): VideoTreeItem[] => {
    let result: VideoTreeItem[] = [];
    
    tree.forEach(item => {
      const flatItem = { ...item, level };
      result.push(flatItem);
      
      if (item.children && item.children.length > 0) {
        result = result.concat(videoUtils.flattenTree(item.children, level + 1));
      }
    });
    
    return result;
  },
  
  /**
   * Get breadcrumb path for a video
   */
  getBreadcrumb: (items: VideoItem[], videoId: number): VideoItem[] => {
    const breadcrumb: VideoItem[] = [];
    
    const findItemAndParents = (id: number): boolean => {
      const item = items.find(i => i.id === id);
      if (!item) return false;
      
      breadcrumb.unshift(item);
      
      if (item.parent_id !== null) {
        return findItemAndParents(item.parent_id);
      }
      
      return true;
    };
    
    findItemAndParents(videoId);
    return breadcrumb;
  },
  
  /**
   * Get localized name based on language preference
   */
  getLocalizedName: (item: VideoItem, language: 'en' | 'kh' | 'ch' = 'en'): string => {
    switch (language) {
      case 'kh':
        return item.name_kh || item.name_en;
      case 'ch':
        return item.name_ch || item.name_en;
      default:
        return item.name_en;
    }
  },
  
  /**
   * Get localized video title based on language preference
   */
  getLocalizedVideoTitle: (item: VideoItem, language: 'en' | 'kh' | 'ch' = 'en'): string => {
    const titleMap = {
      en: item.video_title_en,
      kh: item.video_title_kh,
      ch: item.video_title_ch,
    };
    
    const title = titleMap[language];
    return title || item.name_en;
  },
  
  /**
   * Extract YouTube video ID from URL
   */
  extractYouTubeId: (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  },
  
  /**
   * Get YouTube thumbnail URL
   */
  getYouTubeThumbnail: (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string => {
    const qualities = {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
    
    return qualities[quality];
  },
  
  /**
   * Validate video URL
   */
  isValidVideoUrl: (url: string): boolean => {
    const youtubePatterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    ];
    
    return youtubePatterns.some(pattern => pattern.test(url));
  },
};

/**
 * Hooks for video data (optional - for React)
 */
export const useVideoQueries = () => {
  // This would be implemented in your React component
  // using React Query's useQuery hook
  return {
    // Implementation depends on your React setup
  };
};

// Default export
export default videoQueries;