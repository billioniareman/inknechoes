import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { usersApi, User } from '../api/users'
import { Post } from '../api/posts'
import { getFollowStats, FollowStats } from '../api/follows'
import PostCard from '../components/PostCard'
import FollowButton from '../components/FollowButton'
import UserIdentitySection from '../components/profile/UserIdentitySection'
import WritingAnalytics from '../components/profile/WritingAnalytics'
import ReadingAnalytics from '../components/profile/ReadingAnalytics'
import LanguageStyleInsights from '../components/profile/LanguageStyleInsights'
import ActivityHeatmap from '../components/profile/ActivityHeatmap'
import { Rss } from 'lucide-react'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [followStats, setFollowStats] = useState<FollowStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'writing' | 'reading' | 'insights'>('overview')

  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username])

  const loadProfile = async () => {
    try {
      const [userData, postsData, analyticsData, followStatsData] = await Promise.all([
        usersApi.getUserProfile(username!),
        usersApi.getUserPosts(username!),
        usersApi.getUserAnalytics(username!).catch(() => null), // Analytics might fail for new users
        getFollowStats(username!).catch(() => null), // Follow stats might fail if not logged in
      ])
      setUser(userData)
      setPosts(postsData)
      setAnalytics(analyticsData)
      setFollowStats(followStatsData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <div className="text-center py-16">User not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      {/* User Identity Section */}
      {analytics?.user_stats ? (
        <UserIdentitySection
          user={user}
          stats={analytics.user_stats}
          username={username}
          followStats={followStats}
          onFollowChange={async () => {
            const newStats = await getFollowStats(username!).catch(() => null);
            if (newStats) setFollowStats(newStats);
          }}
        />
      ) : (
        <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 transition-colors">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-literary/15 border-2 border-border/80 flex items-center justify-center text-literary text-2xl sm:text-3xl font-serif font-bold shadow-inner flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                  {user.username}
                </h1>
                <div className="flex items-center gap-2">
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/rss/user/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                    title="RSS Feed"
                  >
                    <Rss className="w-5 h-5" />
                  </a>
                  <FollowButton
                    username={user.username}
                    initialIsFollowing={followStats?.is_following || false}
                    onFollowChange={async () => {
                      const newStats = await getFollowStats(username!).catch(() => null);
                      if (newStats) setFollowStats(newStats);
                    }}
                  />
                </div>
              </div>

              {/* Follow Stats */}
              {followStats && (
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

              {user.bio && <p className="text-sm sm:text-base text-foreground/80 font-serif leading-relaxed mb-3 sm:mb-4 max-w-2xl">{user.bio}</p>}
              {user.genre_tags && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
        </div>
      )}

      {/* Activity Heatmap */}
      {posts.length > 0 && <ActivityHeatmap posts={posts} />}

      {/* Tabs */}
      <div className="border-b border-border/70 mb-6 mt-8 overflow-x-auto">
        <nav className="flex space-x-6 sm:space-x-8 min-w-max">
          {(['overview', 'writing', 'reading', 'insights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium transition-colors capitalize text-sm sm:text-base whitespace-nowrap ${activeTab === tab
                ? 'border-literary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                  Published Works
                </h2>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {posts.length} {posts.length === 1 ? 'publication' : 'publications'}
                </span>
              </div>
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border/60 rounded-2xl">
                  <p className="text-foreground font-serif text-lg">No published works yet.</p>
                  <p className="text-muted-foreground text-sm mt-1.5">This author hasn't published any content yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'writing' && analytics?.writing_analytics && (
          <WritingAnalytics analytics={analytics.writing_analytics} />
        )}

        {activeTab === 'reading' && analytics?.reading_analytics && (
          <ReadingAnalytics analytics={analytics.reading_analytics} />
        )}

        {activeTab === 'insights' && analytics?.language_insights && (
          <LanguageStyleInsights insights={analytics.language_insights} />
        )}

        {/* Show message if analytics not available */}
        {activeTab !== 'overview' && !analytics && (
          <div className="text-center py-16 bg-card border border-border/60 rounded-2xl text-muted-foreground">
            <p className="font-serif text-lg text-foreground mb-1">Analytics not available yet.</p>
            <p className="text-sm">Start writing and reading to build author insights and metrics.</p>
          </div>
        )}
      </div>
    </div>
  )
}

