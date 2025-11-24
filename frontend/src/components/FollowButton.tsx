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
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    );
}
