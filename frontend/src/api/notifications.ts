import axiosClient from './axiosClient';

export interface NotificationActor {
    id: number;
    username: string;
    bio?: string;
}

export interface Notification {
    id: number;
    recipient_id: number;
    actor: NotificationActor;
    notification_type: 'follow' | 'comment' | 'reply' | 'like_post' | 'like_comment' | 'mention';
    post_id?: string;
    comment_id?: number;
    message: string;
    is_read: boolean;
    is_archived: boolean;
    created_at: string;
    read_at?: string;
}

export interface NotificationStats {
    total_count: number;
    unread_count: number;
    archived_count: number;
}

// Get notifications for current user
export const getNotifications = async (
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false,
    includeArchived: boolean = false
): Promise<Notification[]> => {
    const response = await axiosClient.get('/api/v1/notifications', {
        params: {
            limit,
            offset,
            unread_only: unreadOnly,
            include_archived: includeArchived
        }
    });
    return response.data;
};

// Get notification statistics
export const getNotificationStats = async (): Promise<NotificationStats> => {
    const response = await axiosClient.get('/api/v1/notifications/stats');
    return response.data;
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId: number) => {
    const response = await axiosClient.put(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
};

// Mark multiple notifications as read
export const markNotificationsAsRead = async (notificationIds: number[]) => {
    const response = await axiosClient.put('/api/v1/notifications/read', {
        notification_ids: notificationIds
    });
    return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
    const response = await axiosClient.put('/api/v1/notifications/read-all');
    return response.data;
};

// Archive a notification
export const archiveNotification = async (notificationId: number) => {
    const response = await axiosClient.put(`/api/v1/notifications/${notificationId}/archive`);
    return response.data;
};

// Delete a notification
export const deleteNotification = async (notificationId: number) => {
    const response = await axiosClient.delete(`/api/v1/notifications/${notificationId}`);
    return response.data;
};
