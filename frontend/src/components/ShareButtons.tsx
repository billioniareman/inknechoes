import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link, Check } from 'lucide-react';

interface ShareButtonsProps {
    url: string;
    title: string;
    description?: string;
}

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url: fullUrl,
                });
            } catch (error) {
                // User cancelled or error occurred
                console.log('Share cancelled or failed');
            }
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700 font-medium flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                Share:
            </span>

            {/* Native Share (mobile) */}
            {'share' in navigator && (
                <button
                    onClick={handleShare}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Share"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            )}

            {/* Twitter */}
            <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Share on Twitter"
            >
                <Twitter className="w-4 h-4" />
            </a>

            {/* Facebook */}
            <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Share on Facebook"
            >
                <Facebook className="w-4 h-4" />
            </a>

            {/* LinkedIn */}
            <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Share on LinkedIn"
            >
                <Linkedin className="w-4 h-4" />
            </a>

            {/* Copy Link */}
            <button
                onClick={handleCopyLink}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors relative"
                title="Copy link"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                ) : (
                    <Link className="w-4 h-4" />
                )}
            </button>
        </div>
    );
}
