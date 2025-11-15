import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUserStore } from '../store/userStore'
import { PenTool, BookOpen, Users, Sparkles, TrendingUp, Bookmark, Clock } from 'lucide-react'
import { feedApi, PersonalizedFeed } from '../api/feed'
import PostCard from '../components/PostCard'

export default function Home() {
  const { isAuthenticated, user } = useUserStore()
  const [feed, setFeed] = useState<PersonalizedFeed | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadFeed()
    }
  }, [isAuthenticated])

  const loadFeed = async () => {
    setLoading(true)
    try {
      const feedData = await feedApi.getPersonalizedFeed()
      setFeed(feedData)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        /* Authenticated User Feed */
        <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900 mb-1 sm:mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-sm sm:text-base text-amber-800/70">Discover stories tailored for you</p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-amber-800">Loading your feed...</div>
          ) : feed ? (
            <div className="space-y-12">
              {/* Current Reading Section */}
              {feed.current_reading && feed.current_reading.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" />
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-900">Continue Reading</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {feed.current_reading.map((item) => (
                      <div key={item.post.id} className="relative">
                        <PostCard
                          post={item.post}
                          showProgress={true}
                          progressPercentage={item.progress.progress_percentage}
                        />
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-[10px] sm:text-xs text-amber-800/60 bg-white/90 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                          {item.progress.current_page}/{item.progress.total_pages}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Latest Content Section */}
              {feed.latest_posts && feed.latest_posts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" />
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-900">Latest Stories</h2>
                    </div>
                    <Link
                      to="/discover?sort=latest"
                      className="text-xs sm:text-sm text-amber-800 hover:text-amber-900 underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {feed.latest_posts.slice(0, 6).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}

              {/* Most Appreciated Section */}
              {feed.most_appreciated && feed.most_appreciated.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" />
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-900">Most Appreciated</h2>
                    </div>
                    <Link
                      to="/discover?sort=most_appreciated"
                      className="text-xs sm:text-sm text-amber-800 hover:text-amber-900 underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {feed.most_appreciated.slice(0, 6).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}

              {/* Genre-Based Recommendations */}
              {feed.genre_posts && feed.genre_posts.length > 0 && user?.genre_tags && (
                <section>
                  <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800 flex-shrink-0" />
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-900 truncate">
                        For You: {user.genre_tags.split(',')[0].trim()}
                      </h2>
                    </div>
                    <Link
                      to="/discover"
                      className="text-xs sm:text-sm text-amber-800 hover:text-amber-900 underline flex-shrink-0"
                    >
                      Explore more
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {feed.genre_posts.slice(0, 6).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {feed.latest_posts.length === 0 && feed.most_appreciated.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-amber-800 mb-4">No content available yet.</p>
                  <Link
                    to="/write"
                    className="inline-block px-6 py-3 bg-amber-800 text-amber-50 rounded-md hover:bg-amber-900 transition-colors"
                  >
                    Start Writing
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-amber-800">No feed data available</div>
          )}
        </div>
      ) : (
        /* Unauthenticated Landing Page */
        <>
          {/* Hero Section */}
          <section className="text-center py-20 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Accent Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold mb-4 sm:mb-6 leading-tight px-2">
                <span className="text-foreground">Where Stories Find</span>
                <br />
                <span className="text-primary">Their Echo</span>
              </h1>
              
              {/* Subheading */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                A distraction-free sanctuary for writers to create, publish, and share their work. 
                For readers to discover stories that resonate.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-md text-base sm:text-lg font-medium hover:opacity-90 transition-opacity text-center"
                >
                  Create Your Account
                </Link>
                <Link
                  to="/discover"
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-secondary border-2 border-foreground/20 text-foreground rounded-md text-base sm:text-lg font-medium hover:bg-muted transition-colors text-center"
                >
                  Explore Stories
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-white/50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-center mb-8 sm:mb-12 md:mb-16">
                Everything you need to share your voice
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
                {/* Feature 1 */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <PenTool className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-4">Elegant Editor</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A distraction-free writing experience with rich formatting options. 
                    Focus on your craft, not the interface.
                  </p>
                </div>
                
                {/* Feature 2 */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-4">Personal Space</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your own corner of the web with a custom subdomain. 
                    Build your portfolio and connect with readers.
                  </p>
                </div>
                
                {/* Feature 3 */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-4">Engaged Community</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Connect with readers through comments and appreciation. 
                    Build a following around your unique voice.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Additional CTA Section */}
          <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4 sm:mb-6 px-2">
                Ready to share your story?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
                Join a community of writers and readers who believe in the power of words.
              </p>
              <Link
                to="/register"
                className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-md text-base sm:text-lg font-medium hover:opacity-90 transition-opacity"
              >
                Create Your Account
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

