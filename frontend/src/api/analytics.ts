import axiosClient from './axiosClient'

export interface AnalyticsStats {
    total_views: number
    unique_visitors: number
    avg_time_spent: number
    views_chart: { date: string; count: number }[]
}

export interface AuthorAnalyticsStats {
    total_views: number
    total_likes: number
    total_comments: number
    avg_time_spent: number
    top_posts: { title: string; slug: string; views: number }[]
    views_chart: { date: string; count: number }[]
}

export const analyticsApi = {
    trackView: async (postId: number): Promise<{ id: number; status: string }> => {
        const response = await axiosClient.post(`/api/v1/analytics/track/${postId}`)
        return response.data
    },

    trackTime: async (viewId: number, seconds: number): Promise<{ status: string }> => {
        const response = await axiosClient.post(`/api/v1/analytics/time/${viewId}`, { seconds })
        return response.data
    },

    getPostStats: async (postId: number, days: number = 30): Promise<AnalyticsStats> => {
        const response = await axiosClient.get(`/api/v1/analytics/post/${postId}`, { params: { days } })
        return response.data
    },

    getMyStats: async (days: number = 30): Promise<AuthorAnalyticsStats> => {
        const response = await axiosClient.get('/api/v1/analytics/author/me', { params: { days } })
        return response.data
    }
}
