import axiosClient from './axiosClient';

export interface FollowStats {
    followers_count: number;
    following_count: number;
    is_following: boolean;
}

export interface FollowerUser {
    id: number;
    username: string;
    bio?: string;
    genre_tags?: string;
    created_at: string;
    is_following: boolean;
}

// Follow a user
export const followUser = async (username: string) => {
    const response = await axiosClient.post(`/api/v1/follows/${username}/follow`);
    return response.data;
};

// Unfollow a user
export const unfollowUser = async (username: string) => {
    const response = await axiosClient.delete(`/api/v1/follows/${username}/unfollow`);
    return response.data;
};

// Get followers of a user
export const getFollowers = async (username: string, limit: number = 100, offset: number = 0): Promise<FollowerUser[]> => {
    const response = await axiosClient.get(`/api/v1/follows/${username}/followers`, {
        params: { limit, offset }
    });
    return response.data;
};

// Get users that a user follows
export const getFollowing = async (username: string, limit: number = 100, offset: number = 0): Promise<FollowerUser[]> => {
    const response = await axiosClient.get(`/api/v1/follows/${username}/following`, {
        params: { limit, offset }
    });
    return response.data;
};

// Get follow statistics for a user
export const getFollowStats = async (username: string): Promise<FollowStats> => {
    const response = await axiosClient.get(`/api/v1/follows/${username}/follow-stats`);
    return response.data;
};
