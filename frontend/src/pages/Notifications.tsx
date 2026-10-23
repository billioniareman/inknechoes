import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Clock } from 'lucide-react';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    Notification
} from '../api/notifications';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications(50, 0, filter === 'unread', false);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (notificationId: number) => {
        try {
            await deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getNotificationLink = (notification: Notification): string => {
        switch (notification.notification_type) {
            case 'follow':
                return `/user/${notification.actor.username}`;
            case 'comment':
            case 'like_post':
                return `/post/${notification.post_id}`;
            case 'reply':
            case 'like_comment':
                return `/post/${notification.post_id}#comment-${notification.comment_id}`;
            default:
                return '#';
        }
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Notifications</h1>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-primary hover:text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 font-medium transition-colors text-sm sm:text-base ${filter === 'all'
                            ? 'text-foreground border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 font-medium transition-colors text-sm sm:text-base ${filter === 'unread'
                            ? 'text-foreground border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Unread {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`flex items-start gap-3.5 sm:gap-4 p-4 rounded-xl transition-colors shadow-sm ${notification.is_read
                                ? 'bg-card border border-border/70 hover:bg-muted/30 text-card-foreground'
                                : 'bg-primary/5 border border-primary/20 border-l-4 border-l-primary hover:bg-primary/10 text-card-foreground'
                                }`}
                        >
                            {/* Avatar */}
                            <Link to={`/user/${notification.actor.username}`} className="flex-shrink-0">
                                <div className="w-11 h-11 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-serif font-bold text-base sm:text-lg">
                                    {notification.actor.username.charAt(0).toUpperCase()}
                                </div>
                            </Link>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={getNotificationLink(notification)}
                                    className="block hover:underline"
                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                >
                                    <p className="text-foreground text-sm sm:text-base leading-relaxed">{notification.message}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatTime(notification.created_at)}</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                {!notification.is_read && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="p-2 text-primary hover:bg-primary/15 rounded-lg transition-colors"
                                        title="Mark as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(notification.id)}
                                    className="p-2 text-destructive hover:bg-destructive/15 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
