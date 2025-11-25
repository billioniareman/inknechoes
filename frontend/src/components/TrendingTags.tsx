import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrendingTags, TagWithPostCount } from '../api/tags';
import { TrendingUp, Tag as TagIcon } from 'lucide-react';

export default function TrendingTags() {
    const [tags, setTags] = useState<TagWithPostCount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrendingTags();
    }, []);

    const loadTrendingTags = async () => {
        try {
            const data = await getTrendingTags(10);
            setTags(data);
        } catch (error) {
            console.error('Failed to load trending tags:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending Tags
                </h3>
                <p className="text-sm text-amber-600">Loading...</p>
            </div>
        );
    }

    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Link
                        key={tag.id}
                        to={`/tags/${tag.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full text-sm text-amber-900 transition-colors"
                    >
                        <TagIcon className="w-3 h-3" />
                        <span className="font-medium">#{tag.name}</span>
                        <span className="text-xs text-amber-600">({tag.post_count})</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
