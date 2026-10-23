import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFollowers, FollowerUser } from '../api/follows';
import FollowButton from '../components/FollowButton';

export default function Followers() {
    const { username } = useParams<{ username: string }>();
    const [followers, setFollowers] = useState<FollowerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFollowers = async () => {
            if (!username) return;

            setLoading(true);
            setError(null);
            try {
                const data = await getFollowers(username);
                setFollowers(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load followers');
            } finally {
                setLoading(false);
            }
        };

        fetchFollowers();
    }, [username]);

    const handleFollowChange = (followerUsername: string, isFollowing: boolean) => {
        setFollowers(prev =>
            prev.map(f =>
                f.username === followerUsername ? { ...f, is_following: isFollowing } : f
            )
        );
    };

    if (loading) {
        return (
            <div className="py-16 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Loading followers...</div>
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
                    Followers of @{username}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                    {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
                </p>
            </div>

            {followers.length === 0 ? (
                <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
                    <p className="text-muted-foreground">No followers yet</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {followers.map(follower => (
                        <div
                            key={follower.id}
                            className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4 text-card-foreground"
                        >
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/user/${follower.username}`}
                                    className="text-lg sm:text-xl font-serif font-semibold text-foreground hover:text-primary transition-colors truncate block"
                                >
                                    @{follower.username}
                                </Link>
                                {follower.bio && (
                                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{follower.bio}</p>
                                )}
                                {follower.genre_tags && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {follower.genre_tags.split(',').map(tag => (
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
                                    Joined {new Date(follower.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <FollowButton
                                    username={follower.username}
                                    initialIsFollowing={follower.is_following}
                                    onFollowChange={(isFollowing) =>
                                        handleFollowChange(follower.username, isFollowing)
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
