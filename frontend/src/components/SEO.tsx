import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    author?: string;
    publishedTime?: string;
    tags?: string[];
}

export default function SEO({
    title = 'Ink&Echoes - A Platform for Writers and Readers',
    description = 'Discover, read, and share amazing stories, poetry, and books from talented writers around the world.',
    image = '/og-image.png',
    url,
    type = 'website',
    author,
    publishedTime,
    tags = []
}: SEOProps) {
    const siteUrl = 'http://localhost:3000'; // TODO: Replace with actual domain
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const imageUrl = image || '/og-image.png';
    const fullImage = imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content="Ink&Echoes" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={fullUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={fullImage} />

            {/* Article specific */}
            {type === 'article' && (
                <>
                    {author && <meta property="article:author" content={author} />}
                    {publishedTime && <meta property="article:published_time" content={publishedTime} />}
                    {tags.map((tag, index) => (
                        <meta key={index} property="article:tag" content={tag} />
                    ))}
                </>
            )}

            {/* Canonical URL */}
            <link rel="canonical" href={fullUrl} />
        </Helmet>
    );
}
