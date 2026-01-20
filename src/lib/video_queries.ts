import { videoApi, type VideoItem, type VideoTreeItem, type ApiResponse } from './video_api';

export type { VideoItem, VideoTreeItem, ApiResponse };

export interface VideoQueryParams {
  language?: string;
  status?: number;
  parent_id?: number | null;
  company_id?: string;
  page?: number;
  limit?: number;
  search?: string;
}

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


export const videoQueries = {

  getVideos: (params?: VideoQueryParams) => ({
    queryKey: videoQueryKeys.list(params),
    queryFn: () => videoApi.getVideos(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),
  
  getVideoById: (id: number) => ({
    queryKey: videoQueryKeys.detail(id),
    queryFn: () => videoApi.getVideoById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
  }),
  
  getVideoTree: () => ({
    queryKey: videoQueryKeys.tree(),
    queryFn: () => videoApi.getVideoTree(),
    staleTime: 5 * 60 * 1000,
  }),
  
  getVideosByParentId: (parentId: number | null) => ({
    queryKey: videoQueryKeys.byParent(parentId),
    queryFn: () => videoApi.getVideosByParentId(parentId),
    staleTime: 5 * 60 * 1000,
  }),
};

export const videoUtils = {

  buildTree: (items: VideoItem[], parentId: number | null = null): VideoTreeItem[] => {
    if (!items || items.length === 0) return [];
    
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => ({
        ...item,
        level: parentId === null ? 0 : 0,
        children: videoUtils.buildTree(items, item.id),
      }));
  },

  flattenTree: (tree: VideoTreeItem[], level: number = 0): VideoItem[] => {
    if (!tree || tree.length === 0) return [];
    
    let result: VideoItem[] = [];
    
    tree.forEach(item => {
      const { ...itemWithoutChildren } = item;
      const flatItem = { ...itemWithoutChildren, level };
      result.push(flatItem);
      
      if (item.children && item.children.length > 0) {
        result = result.concat(videoUtils.flattenTree(item.children, level + 1));
      }
    });
    
    return result;
  },

  getLocalizedName: (item: VideoItem, language: string = 'en'): string => {
    if (!item) return 'Unknown Video';
    
    switch (language) {
      case 'kh':
        return item.name_kh?.trim() || item.name_en?.trim() || `Video ${item.id}`;
      case 'ch':
        return item.name_ch?.trim() || item.name_en?.trim() || `Video ${item.id}`;
      default:
        return item.name_en?.trim() || `Video ${item.id}`;
    }
  },

  getLocalizedVideoTitle: (item: VideoItem, language: string = 'en'): string => {
    if (!item) return 'Unknown Video';
    
    const titleMap = {
      en: item.video_title_en,
      kh: item.video_title_kh,
      ch: item.video_title_ch,
    };
    
    const title = titleMap[language as keyof typeof titleMap];
    return title?.trim() || item.name_en?.trim() || `Video ${item.id}`;
  },

  extractYouTubeId: (url: string | null): string | null => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  },

  getYouTubeThumbnail: (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string => {
    const qualities = {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
    
    return qualities[quality];
  },
  
  isValidYouTubeUrl: (url: string | null): boolean => {
    if (!url) return false;
    
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      /^(https?:\/\/)?(www\.)?(m\.youtube\.com)\/.+$/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  },
};

export default videoQueries;