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
            <div className="max-w-7xl mx-auto py-8 px-4 text-center">
                <p className="text-amber-700 text-lg">Tag not found</p>
                <Link to="/discover" className="text-amber-600 hover:text-amber-800 mt-4 inline-block">
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
                className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Discover
            </Link>

            {/* Tag Header */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <TagIcon className="w-6 h-6 text-amber-600" />
                    <h1 className="text-3xl font-serif font-bold text-amber-900">
                        #{tag?.name || tagSlug}
                    </h1>
                </div>
                {tag?.description && (
                    <p className="text-amber-800 text-lg">{tag.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-amber-700">
                    <span className="flex items-center gap-1">
                        <strong>{total}</strong> posts
                    </span>
                    <span className="flex items-center gap-1">
                        Used <strong>{tag?.usage_count || 0}</strong> times total
                    </span>
                </div>
            </div>

            {/* Posts */}
            {loading ? (
                <div className="text-center py-16 text-amber-800">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-white/40 border border-amber-200/50 rounded-lg">
                    <p className="text-amber-700 text-lg">No posts found with this tag.</p>
                    <Link to="/discover" className="text-amber-600 hover:text-amber-800 mt-2 inline-block">
                        Browse all posts →
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {total > 20 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-amber-900">
                                Page {page} of {Math.ceil(total / 20)}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(total / 20)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
