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
        <div className="bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 border border-amber-200/50 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-serif font-bold shadow-lg flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900">
                  {user.username}
                </h1>
                <FollowButton
                  username={user.username}
                  initialIsFollowing={followStats?.is_following || false}
                  onFollowChange={async () => {
                    // Refresh follow stats after follow/unfollow
                    const newStats = await getFollowStats(username!).catch(() => null);
                    if (newStats) setFollowStats(newStats);
                  }}
                />
              </div>

              {/* Follow Stats */}
              {followStats && (
                <div className="flex gap-4 mb-3 text-sm text-amber-800">
                  <Link
                    to={`/user/${username}/followers`}
                    className="hover:text-amber-900 hover:underline"
                  >
                    <span className="font-semibold">{followStats.followers_count}</span> followers
                  </Link>
                  <Link
                    to={`/user/${username}/following`}
                    className="hover:text-amber-900 hover:underline"
                  >
                    <span className="font-semibold">{followStats.following_count}</span> following
                  </Link>
                </div>
              )}

              {user.bio && <p className="text-sm sm:text-base text-amber-800/80 mb-3 sm:mb-4 max-w-2xl">{user.bio}</p>}
              {user.genre_tags && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {user.genre_tags.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-medium border border-amber-200"
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
      <div className="border-b border-amber-200/50 mb-4 sm:mb-6 mt-6 sm:mt-8 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 min-w-max">
          {(['overview', 'writing', 'reading', 'insights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium transition-colors capitalize text-sm sm:text-base whitespace-nowrap ${activeTab === tab
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-amber-700 hover:text-amber-900'
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
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-amber-900">
                  Published Works
                </h2>
                <span className="text-xs sm:text-sm text-amber-800/70">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              {posts.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-white/40 border border-amber-200/50 rounded-lg">
                  <p className="text-amber-700 text-base sm:text-lg">No published works yet.</p>
                  <p className="text-amber-600/70 text-xs sm:text-sm mt-2">This author hasn't published any content.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="text-center py-12 text-amber-700">
            <p>Analytics not available yet. Start writing to see your insights!</p>
          </div>
        )}
      </div>
    </div>
  )
}

