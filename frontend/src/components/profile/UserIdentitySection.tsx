import { User } from '../../api/users'
import { Calendar, Heart, Hand, Users, Flame, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import FollowButton from '../FollowButton'
import { FollowStats } from '../../api/follows'

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
  username?: string
  followStats?: FollowStats | null
  onFollowChange?: () => void
}

export default function UserIdentitySection({ user, stats, username, followStats, onFollowChange }: UserIdentitySectionProps) {
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
    <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 transition-colors">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
        {/* Profile Picture Placeholder */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-literary/15 border-2 border-border/80 flex items-center justify-center text-literary text-2xl sm:text-3xl font-serif font-bold shadow-inner flex-shrink-0">
          {user.username.charAt(0).toUpperCase()}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground tracking-tight">
                {user.username}
              </h1>
              <p className="text-base text-literary italic mt-1">
                {getTagline()}
              </p>
            </div>
            <FollowButton
              username={user.username}
              initialIsFollowing={followStats?.is_following || false}
              onFollowChange={onFollowChange}
            />
          </div>

          {/* Follow Stats */}
          {followStats && username && (
            <div className="flex gap-4 mb-3 text-sm text-muted-foreground">
              <Link
                to={`/user/${username}/followers`}
                className="hover:text-foreground transition-colors"
              >
                <span className="font-semibold text-foreground">{followStats.followers_count}</span> followers
              </Link>
              <span className="text-border">·</span>
              <Link
                to={`/user/${username}/following`}
                className="hover:text-foreground transition-colors"
              >
                <span className="font-semibold text-foreground">{followStats.following_count}</span> following
              </Link>
            </div>
          )}

          {user.bio && (
            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed mb-4 max-w-2xl font-serif">
              {user.bio}
            </p>
          )}

          {/* Genre Tags */}
          {user.genre_tags && (
            <div className="flex flex-wrap gap-2">
              {user.genre_tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-sans tracking-wide uppercase border border-border/60"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-border/70">
        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Calendar className="w-4 h-4 text-literary" />
            <span className="text-xs font-sans tracking-wide uppercase">Joined</span>
          </div>
          <p className="text-base sm:text-lg font-serif font-semibold text-foreground">
            {formatDate(stats.join_date)}
          </p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Heart className="w-4 h-4 text-terracotta" />
            <span className="text-xs font-sans tracking-wide uppercase">Total Reads</span>
          </div>
          <p className="text-base sm:text-lg font-serif font-semibold text-foreground">
            {stats.total_reads.toLocaleString()}
          </p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Hand className="w-4 h-4 text-literary" />
            <span className="text-xs font-sans tracking-wide uppercase">Total Likes</span>
          </div>
          <p className="text-base sm:text-lg font-serif font-semibold text-foreground">
            {stats.total_likes.toLocaleString()}
          </p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Users className="w-4 h-4 text-sage" />
            <span className="text-xs font-sans tracking-wide uppercase">Followers</span>
          </div>
          <p className="text-base sm:text-lg font-serif font-semibold text-foreground">
            {stats.total_followers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Flame className="w-4 h-4 text-terracotta" />
            <span className="text-xs font-sans tracking-wide uppercase">Writing Streak</span>
          </div>
          <p className="text-2xl font-serif font-bold text-foreground">
            {stats.writing_streak} <span className="text-sm font-sans font-normal text-muted-foreground">days</span>
          </p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <TrendingUp className="w-4 h-4 text-literary" />
            <span className="text-xs font-sans tracking-wide uppercase">Engagement Score</span>
          </div>
          <p className="text-2xl font-serif font-bold text-foreground">
            {stats.engagement_score}
          </p>
        </div>

        <div className="bg-background/80 rounded-xl p-4 border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <span className="text-xs font-sans tracking-wide uppercase">Total Publications</span>
          </div>
          <p className="text-2xl font-serif font-bold text-foreground">
            {stats.total_posts}
          </p>
        </div>
      </div>
    </div>
  )
}

