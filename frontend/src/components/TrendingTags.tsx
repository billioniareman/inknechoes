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
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm text-card-foreground">
                <h3 className="font-serif font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Trending Tags
                </h3>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm text-card-foreground">
            <h3 className="font-serif font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <Link
                        key={tag.id}
                        to={`/tags/${tag.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground hover:bg-muted border border-border/70 rounded-full text-xs sm:text-sm font-medium transition-colors"
                    >
                        <TagIcon className="w-3 h-3 text-muted-foreground" />
                        <span>#{tag.name}</span>
                        <span className="text-xs text-muted-foreground">({tag.post_count})</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
