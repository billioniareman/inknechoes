import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getNotificationStats, NotificationStats } from '../api/notifications';
import { useUserStore } from '../store/userStore';

export default function NotificationBell() {
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const { isAuthenticated } = useUserStore();

    useEffect(() => {
        if (isAuthenticated) {
            loadStats();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadStats, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const loadStats = async () => {
        try {
            const data = await getNotificationStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load notification stats:', error);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Link to="/notifications" className="relative">
            <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" />
            {stats && stats.unread_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {stats.unread_count > 9 ? '9+' : stats.unread_count}
                </span>
            )}
        </Link>
    );
}
