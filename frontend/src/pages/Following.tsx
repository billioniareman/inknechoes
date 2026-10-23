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
            <div className="py-16 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Loading following...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 flex items-center justify-center">
                <div className="text-destructive text-sm">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6 sm:mb-8">
                <Link
                    to={`/user/${username}`}
                    className="text-primary hover:underline mb-3 inline-flex items-center gap-1 text-sm font-medium"
                >
                    ← Back to Profile
                </Link>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                    @{username} is following
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                    {following.length} {following.length === 1 ? 'user' : 'users'}
                </p>
            </div>

            {following.length === 0 ? (
                <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
                    <p className="text-muted-foreground">Not following anyone yet</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {following.map(user => (
                        <div
                            key={user.id}
                            className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4 text-card-foreground"
                        >
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/user/${user.username}`}
                                    className="text-lg sm:text-xl font-serif font-semibold text-foreground hover:text-primary transition-colors truncate block"
                                >
                                    @{user.username}
                                </Link>
                                {user.bio && (
                                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{user.bio}</p>
                                )}
                                {user.genre_tags && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {user.genre_tags.split(',').map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs font-medium border border-border/50"
                                            >
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
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
    );
}
