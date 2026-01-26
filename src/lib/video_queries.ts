import { videoApi, type VideoItem, type ApiResponse } from "../lib/api";

export type { VideoItem, ApiResponse };

export interface VideoQueryParams {
  language?: string;
  status?: number;
  parent_id?: number | null;
  company_id?: string;
  page?: number;
  limit?: number;
  search?: string;
  endpoint?: 'help_center' | 'help_center_video' | 'auto';
}

export const videoQueryKeys = {
  all: ["videos"] as const,
  lists: () => [...videoQueryKeys.all, "list"] as const,
  list: (filters?: VideoQueryParams) =>
    [...videoQueryKeys.lists(), filters] as const,
  details: () => [...videoQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...videoQueryKeys.details(), id] as const,
  tree: () => [...videoQueryKeys.all, "tree"] as const,
  byParent: (parentId: number | null) =>
    [...videoQueryKeys.all, "parent", parentId] as const,
  byCompany: (companyId: string, filters?: VideoQueryParams) =>
    [...videoQueryKeys.all, "company", companyId, filters] as const,
};

export const videoQueries = {
  getVideos: (params?: VideoQueryParams) => ({
    queryKey: videoQueryKeys.list(params),
    queryFn: async (): Promise<ApiResponse<VideoItem[]>> => {
      console.log("videoQueries.getVideos - Fetching videos with params:", params);
      const response = await videoApi.getVideos(params);
      console.log("videoQueries.getVideos - Response:", response);
      
      if (response.success && !response.data) {
        console.log("videoQueries.getVideos - Success but no data, returning empty array");
        return {
          ...response,
          data: []
        };
      }
      
      return response;
    },
    staleTime: 5 * 60 * 1000, 
  }),

  getVideoById: (id: number) => ({
    queryKey: videoQueryKeys.detail(id),
    queryFn: async (): Promise<ApiResponse<VideoItem>> => {
      console.log("videoQueries.getVideoById - Fetching video by ID:", id);
      const response = await videoApi.getVideoById(id);
      console.log("videoQueries.getVideoById - Response:", response);
      return response;
    },
    staleTime: 10 * 60 * 1000, 
  }),

  getVideoTree: () => ({
    queryKey: videoQueryKeys.tree(),
    queryFn: async (): Promise<ApiResponse<VideoItem[]>> => {
      console.log("videoQueries.getVideoTree - Fetching video tree");
      const response = await videoApi.getVideoTree();
      console.log("videoQueries.getVideoTree - Response:", response);
      return response;
    },
    staleTime: 5 * 60 * 1000,
  }),

  getVideosByParentId: (parentId: number | null) => ({
    queryKey: videoQueryKeys.byParent(parentId),
    queryFn: async (): Promise<ApiResponse<VideoItem[]>> => {
      console.log("videoQueries.getVideosByParentId - Fetching videos by parent ID:", parentId);
      const response = await videoApi.getVideosByParentId(parentId);
      console.log("videoQueries.getVideosByParentId - Response:", response);
      return response;
    },
    staleTime: 5 * 60 * 1000,
  }),
};

export interface VideoTreeItem extends VideoItem {
  children?: VideoTreeItem[];
  level?: number;
}

export const videoUtils = {
  buildTree: (
    items: VideoItem[],
    parentId: number | null = null,
    level: number = 0,
  ): VideoTreeItem[] => {
    console.log("videoUtils.buildTree - Building tree with items:", items?.length);
    
    if (!items || items.length === 0) {
      console.log("videoUtils.buildTree - No items to build tree from");
      return [];
    }

    console.log(
      "videoUtils.buildTree - Building tree with items:",
      items.length,
      "parentId:",
      parentId,
      "level:",
      level,
    );

    const treeItems = items
      .filter((item) => {
        const itemParentId = item.parent_id;
        const matchesParent =
          parentId === null
            ? itemParentId === null ||
              itemParentId === 0 ||
              itemParentId === undefined
            : itemParentId === parentId;

        return matchesParent;
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item) => {
        const children = videoUtils.buildTree(items, item.id, level + 1);

        return {
          ...item,
          level: level,
          children: children.length > 0 ? children : undefined,
        } as VideoTreeItem;
      });

    console.log(
      `videoUtils.buildTree - Built ${treeItems.length} items for parent ${parentId} at level ${level}`,
    );
    return treeItems;
  },

  flattenTree: (tree: VideoTreeItem[], level: number = 0): VideoItem[] => {
    if (!tree || tree.length === 0) return [];

    let result: VideoItem[] = [];

    tree.forEach((item) => {
      const { children, ...itemWithoutChildren } = item;
      const flatItem = { ...itemWithoutChildren };
      result.push(flatItem);

      if (children && children.length > 0) {
        result = result.concat(videoUtils.flattenTree(children, level + 1));
      }
    });

    return result;
  },

  getLocalizedName: (item: VideoItem, language: string = "en"): string => {
    if (!item) return "Unknown Video";

    switch (language) {
      case "kh":
        return (
          item.name_kh?.trim() || item.name_en?.trim() || `Video ${item.id}`
        );
      case "ch":
        return (
          item.name_ch?.trim() || item.name_en?.trim() || `Video ${item.id}`
        );
      default:
        return item.name_en?.trim() || `Video ${item.id}`;
    }
  },

  getLocalizedVideoTitle: (
    item: VideoItem,
    language: string = "en",
  ): string => {
    if (!item) return "Unknown Video";

    const titleMap: Record<string, string | null> = {
      en: item.video_title_en,
      kh: item.video_title_kh,
      ch: item.video_title_ch,
    };

    const title = titleMap[language] || item.video_title_en;
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

  getYouTubeThumbnail: (
    videoId: string,
    quality: "default" | "medium" | "high" | "maxres" = "maxres",
  ): string => {
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

    return patterns.some((pattern) => pattern.test(url));
  },
};

export default videoQueries;
