import { useState } from 'react';
import { followUser, unfollowUser } from '../api/follows';
import { useUserStore } from '../store/userStore';

interface FollowButtonProps {
    username: string;
    initialIsFollowing: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ username, initialIsFollowing, onFollowChange }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);
    const { user } = useUserStore();

    // Don't show follow button for own profile
    if (user?.username === username) {
        return null;
    }

    const handleFollow = async () => {
        console.log('FollowButton clicked:', { username, isFollowing, user: user?.username });
        setLoading(true);
        try {
            if (isFollowing) {
                console.log('Attempting to unfollow...');
                await unfollowUser(username);
                setIsFollowing(false);
                onFollowChange?.(false);
                console.log('✓ Successfully unfollowed');
            } else {
                console.log('Attempting to follow...');
                await followUser(username);
                setIsFollowing(true);
                onFollowChange?.(true);
                console.log('✓ Successfully followed');
            }
        } catch (error: any) {
            console.error('❌ Error toggling follow status:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            alert(`Failed to ${isFollowing ? 'unfollow' : 'follow'}: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isFollowing
                ? 'border border-border bg-card text-foreground hover:bg-muted/60 hover:border-destructive/40 hover:text-destructive'
                : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    );
}
