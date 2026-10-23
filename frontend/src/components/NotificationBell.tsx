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
        <Link to="/notifications" className="relative p-1.5 rounded-lg hover:bg-muted/50 transition-colors inline-flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground/80 hover:text-primary transition-colors" />
            {stats && stats.unread_count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center shadow-sm">
                    {stats.unread_count > 9 ? '9+' : stats.unread_count}
                </span>
            )}
        </Link>
    );
}
