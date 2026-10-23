import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTagBySlug, getPostsByTag, Tag } from '../api/tags';
import { Post } from '../api/posts';
import PostCard from '../components/PostCard';
import { Tag as TagIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BrowseByTag() {
    const { tagSlug } = useParams<{ tagSlug: string }>();
    const [tag, setTag] = useState<Tag | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (tagSlug) {
            loadTag();
            loadPosts();
        }
    }, [tagSlug, page]);

    const loadTag = async () => {
        try {
            const tagData = await getTagBySlug(tagSlug!);
            setTag(tagData);
        } catch (error) {
            console.error('Failed to load tag:', error);
        }
    };

    const loadPosts = async () => {
        try {
            setLoading(true);
            const data = await getPostsByTag(tagSlug!, page, 20);
            setPosts(data.posts);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!tag && !loading) {
        return (
            <div className="max-w-7xl mx-auto py-12 px-4 text-center">
                <p className="text-muted-foreground text-lg">Tag not found</p>
                <Link to="/discover" className="text-primary hover:underline mt-4 inline-block font-medium">
                    ← Back to Discover
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Back Button */}
            <Link
                to="/discover"
                className="inline-flex items-center gap-2 text-primary hover:underline mb-6 text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Discover
            </Link>

            {/* Tag Header */}
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-8 shadow-sm text-card-foreground">
                <div className="flex items-center gap-3 mb-2">
                    <TagIcon className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground">
                        #{tag?.name || tagSlug}
                    </h1>
                </div>
                {tag?.description && (
                    <p className="text-muted-foreground text-base sm:text-lg mt-1">{tag.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <strong className="text-foreground">{total}</strong> posts
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        Used <strong className="text-foreground">{tag?.usage_count || 0}</strong> times total
                    </span>
                </div>
            </div>

            {/* Posts */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <p className="text-muted-foreground text-lg">No posts found with this tag.</p>
                    <Link to="/discover" className="text-primary hover:underline mt-2 inline-block font-medium">
                        Browse all posts →
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {total > 20 && (
                        <div className="flex justify-center items-center gap-3 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition shadow-sm"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm text-muted-foreground">
                                Page <strong className="text-foreground">{page}</strong> of {Math.ceil(total / 20)}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(total / 20)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
