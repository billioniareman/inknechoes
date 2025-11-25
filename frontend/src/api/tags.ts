import axiosClient from './axiosClient';

export interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    usage_count: number;
    created_at: string;
    updated_at: string;
}

export interface TagWithPostCount extends Tag {
    post_count: number;
}

export interface TagStats {
    total_tags: number;
    most_used_tag?: Tag;
    recent_tags: Tag[];
}

// Create a new tag
export const createTag = async (name: string, description?: string): Promise<Tag> => {
    const response = await axiosClient.post('/api/v1/tags', {
        name,
        description
    });
    return response.data;
};

// Get all tags
export const getAllTags = async (skip: number = 0, limit: number = 100): Promise<Tag[]> => {
    const response = await axiosClient.get('/api/v1/tags', {
        params: { skip, limit }
    });
    return response.data;
};

// Search tags (for auto-suggest)
export const searchTags = async (query: string, limit: number = 20): Promise<Tag[]> => {
    const response = await axiosClient.get('/api/v1/tags/search', {
        params: { q: query, limit }
    });
    return response.data;
};

// Get popular tags
export const getPopularTags = async (limit: number = 20): Promise<Tag[]> => {
    const response = await axiosClient.get('/api/v1/tags/popular', {
        params: { limit }
    });
    return response.data;
};

// Get trending tags
export const getTrendingTags = async (limit: number = 10): Promise<TagWithPostCount[]> => {
    const response = await axiosClient.get('/api/v1/tags/trending', {
        params: { limit }
    });
    return response.data;
};

// Get tag statistics
export const getTagStats = async (): Promise<TagStats> => {
    const response = await axiosClient.get('/api/v1/tags/stats');
    return response.data;
};

// Get tag by slug
export const getTagBySlug = async (slug: string): Promise<Tag> => {
    const response = await axiosClient.get(`/api/v1/tags/${slug}`);
    return response.data;
};

// Get posts by tag
export const getPostsByTag = async (
    tagSlug: string,
    page: number = 1,
    pageSize: number = 20
): Promise<{ posts: any[]; total: number; page: number; page_size: number }> => {
    const response = await axiosClient.get(`/api/v1/tags/${tagSlug}/posts`, {
        params: { page, page_size: pageSize }
    });
    return response.data;
};

// Update tag (admin only)
export const updateTag = async (tagId: number, name?: string, description?: string): Promise<Tag> => {
    const response = await axiosClient.put(`/api/v1/tags/${tagId}`, {
        name,
        description
    });
    return response.data;
};

// Delete tag (admin only)
export const deleteTag = async (tagId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/tags/${tagId}`);
};
