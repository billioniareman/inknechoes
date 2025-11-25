import axiosClient from './axiosClient'

export interface PostContent {
  body: string
  tags: string[]
  cover_image_url?: string
  description?: string
}

export interface Post {
  id: number
  title: string
  slug: string
  author_id: number
  author_username?: string
  mongo_id: string
  visibility: string
  content_type: string
  likes_count: number
  claps_count: number
  cover_image_url?: string
  created_at: string
  updated_at?: string
}

export interface PostWithContent extends Post {
  content: PostContent
}

export interface PostCreate {
  title: string
  slug: string
  visibility: string
  content_type: string
  content: PostContent
}

export interface PostUpdate {
  title?: string
  slug?: string
  visibility?: string
  content?: PostContent
  content_type?: string
}

export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  page_size: number
}

export const postsApi = {
  createPost: async (data: PostCreate): Promise<Post> => {
    const response = await axiosClient.post('/api/v1/posts', data)
    return response.data
  },

  getPosts: async (page = 1, pageSize = 20, sortBy = 'latest', search?: string, contentType?: string): Promise<PostListResponse> => {
    const params: any = { page, page_size: pageSize, sort_by: sortBy }
    if (search) params.search = search
    if (contentType) params.content_type = contentType
    const response = await axiosClient.get('/api/v1/posts', { params })
    return response.data
  },

  getPost: async (postId: number): Promise<PostWithContent> => {
    const response = await axiosClient.get(`/api/v1/posts/${postId}`)
    return response.data
  },

  getPostBySlug: async (slug: string): Promise<PostWithContent> => {
    const response = await axiosClient.get(`/api/v1/posts/slug/${slug}`)
    return response.data
  },

  likePost: async (postId: number): Promise<Post> => {
    const response = await axiosClient.post(`/api/v1/posts/${postId}/like`)
    return response.data
  },

  clapPost: async (postId: number): Promise<Post> => {
    const response = await axiosClient.post(`/api/v1/posts/${postId}/clap`)
    return response.data
  },

  getPostEngagement: async (postId: number): Promise<{
    is_liked: boolean
    has_clapped: boolean
    likes_count: number
    claps_count: number
  }> => {
    const response = await axiosClient.get(`/api/v1/posts/${postId}/engagement`)
    return response.data
  },

  getMyPosts: async (includeDrafts = false): Promise<Post[]> => {
    const response = await axiosClient.get('/api/v1/posts/me', {
      params: { include_drafts: includeDrafts },
    })
    return response.data
  },

  updatePost: async (postId: number, data: PostUpdate): Promise<Post> => {
    const response = await axiosClient.put(`/api/v1/posts/${postId}`, data)
    return response.data
  },

  deletePost: async (postId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/posts/${postId}`)
  },

  searchPosts: async (params: {
    page?: number
    page_size?: number
    sort_by?: string
    search?: string
    author?: string
    content_type?: string
    genre?: string
    start_date?: string
    end_date?: string
    full_text?: boolean
  }): Promise<PostListResponse> => {
    const cleanParams: any = {}
    if (params.page) cleanParams.page = params.page
    if (params.page_size) cleanParams.page_size = params.page_size
    if (params.sort_by) cleanParams.sort_by = params.sort_by
    if (params.search) cleanParams.search = params.search
    if (params.author) cleanParams.author = params.author
    if (params.content_type) cleanParams.content_type = params.content_type
    if (params.genre) cleanParams.genre = params.genre
    if (params.start_date) cleanParams.start_date = params.start_date
    if (params.end_date) cleanParams.end_date = params.end_date
    if (params.full_text !== undefined) cleanParams.full_text = params.full_text

    const response = await axiosClient.get('/api/v1/posts/search', { params: cleanParams })
    return response.data
  },
}

