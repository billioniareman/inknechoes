import axiosClient from './axiosClient'
import { PostWithContent } from './posts'

export interface ReadingProgress {
  current_page: number
  total_pages: number
  progress_percentage: number
  last_read_at: string | null
}

export interface CurrentReadingItem {
  post: PostWithContent
  progress: ReadingProgress
}

export interface PersonalizedFeed {
  latest_posts: PostWithContent[]
  most_appreciated: PostWithContent[]
  genre_posts: PostWithContent[]
  current_reading: CurrentReadingItem[]
}

export const feedApi = {
  getPersonalizedFeed: async (): Promise<PersonalizedFeed> => {
    const response = await axiosClient.get('/api/v1/feed/personalized')
    return response.data
  },
}

