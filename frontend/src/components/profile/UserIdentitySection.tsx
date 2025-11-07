import { User } from '../../api/users'
import { Calendar, Heart, Hand, Users, Flame, TrendingUp } from 'lucide-react'

interface UserIdentitySectionProps {
  user: User
  stats: {
    join_date?: string
    total_reads: number
    total_likes: number
    total_claps: number
    total_followers: number
    writing_streak: number
    engagement_score: number
    total_posts: number
  }
}

export default function UserIdentitySection({ user, stats }: UserIdentitySectionProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Generate tagline from genre tags
  const getTagline = () => {
    if (user.genre_tags) {
      const tags = user.genre_tags.split(',').map(t => t.trim())
      if (tags.length > 0) {
        const taglineMap: Record<string, string> = {
          'poetry': 'Poet of Emotions',
          'fiction': 'Storyteller',
          'non-fiction': 'Knowledge Seeker',
          'tech': 'Tech Storyteller',
          'travel': 'Wanderlust Writer',
          'personal': 'Personal Growth Advocate',
          'spiritual': 'Spiritual Guide'
        }
        return taglineMap[tags[0].toLowerCase()] || `${tags[0]} Writer`
      }
    }
    return 'Creative Writer'
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 border border-amber-200/50 rounded-lg shadow-lg p-8 mb-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        {/* Profile Picture Placeholder */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-serif font-bold shadow-lg">
          {user.username.charAt(0).toUpperCase()}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-4xl font-serif font-bold text-amber-900 mb-2">
            {user.username}
          </h1>
          <p className="text-lg text-amber-700 italic mb-3">
            {getTagline()}
          </p>
          {user.bio && (
            <p className="text-amber-800/80 mb-4 max-w-2xl">
              {user.bio}
            </p>
          )}
          
          {/* Genre Tags */}
          {user.genre_tags && (
            <div className="flex flex-wrap gap-2">
              {user.genre_tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-amber-200/50">
        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Joined</span>
          </div>
          <p className="text-lg font-semibold text-amber-900">
            {formatDate(stats.join_date)}
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-xs font-medium">Total Reads</span>
          </div>
          <p className="text-lg font-semibold text-amber-900">
            {stats.total_reads.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Hand className="w-4 h-4" />
            <span className="text-xs font-medium">Total Likes</span>
          </div>
          <p className="text-lg font-semibold text-amber-900">
            {stats.total_likes.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Followers</span>
          </div>
          <p className="text-lg font-semibold text-amber-900">
            {stats.total_followers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-medium">Writing Streak</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">
            {stats.writing_streak} days
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Engagement Score</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">
            {stats.engagement_score}
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <span className="text-xs font-medium">Total Posts</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">
            {stats.total_posts}
          </p>
        </div>
      </div>
    </div>
  )
}

