import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFollowing, FollowerUser } from '../api/follows';
import FollowButton from '../components/FollowButton';

export default function Following() {
    const { username } = useParams<{ username: string }>();
    const [following, setFollowing] = useState<FollowerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFollowing = async () => {
            if (!username) return;

            setLoading(true);
            setError(null);
            try {
                const data = await getFollowing(username);
                setFollowing(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load following list');
            } finally {
                setLoading(false);
            }
        };

        fetchFollowing();
    }, [username]);

    const handleFollowChange = (followedUsername: string, isFollowing: boolean) => {
        setFollowing(prev =>
            prev.map(f =>
                f.username === followedUsername ? { ...f, is_following: isFollowing } : f
            )
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading following...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link
                        to={`/user/${username}`}
                        className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
                    >
                        ← Back to Profile
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        @{username} is following
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {following.length} {following.length === 1 ? 'user' : 'users'}
                    </p>
                </div>

                {following.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">Not following anyone yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {following.map(user => (
                            <div
                                key={user.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-start justify-between"
                            >
                                <div className="flex-1">
                                    <Link
                                        to={`/user/${user.username}`}
                                        className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600"
                                    >
                                        @{user.username}
                                    </Link>
                                    {user.bio && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-2">{user.bio}</p>
                                    )}
                                    {user.genre_tags && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {user.genre_tags.split(',').map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                                                >
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                        Joined {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <FollowButton
                                        username={user.username}
                                        initialIsFollowing={user.is_following}
                                        onFollowChange={(isFollowing) =>
                                            handleFollowChange(user.username, isFollowing)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
