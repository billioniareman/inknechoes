import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUserStore } from '../store/userStore'
import { postsApi, Post, PostWithContent } from '../api/posts'
import { feedApi, PersonalizedFeed } from '../api/feed'
import { getTrendingTags, TagWithPostCount } from '../api/tags'
import BookCard from '../components/cards/BookCard'
import PoemCard from '../components/cards/PoemCard'
import StoryCard from '../components/cards/StoryCard'
import AuthorCard from '../components/cards/AuthorCard'
import {
  Feather,
  Sparkles,
  BookOpen,
  ArrowRight,
  Bookmark,
  FileText,
  Quote
} from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useUserStore()
  const [feed, setFeed] = useState<PersonalizedFeed | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [editorPicks, setEditorPicks] = useState<Post[]>([])
  const [poemOfTheDay, setPoemOfTheDay] = useState<PostWithContent | null>(null)
  const [trendingTags, setTrendingTags] = useState<TagWithPostCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomepageContent()
  }, [isAuthenticated])

  const loadHomepageContent = async () => {
    setLoading(true)
    try {
      // 1. Fetch recent publications
      const recentRes = await postsApi.getPosts(1, 9, 'latest')
      setRecentPosts(recentRes.posts || [])

      // 2. Fetch popular / editor picks
      const picksRes = await postsApi.getPosts(1, 6, 'most_appreciated')
      setEditorPicks(picksRes.posts || [])

      // 3. Find poem of the day (find a poem post or fetch first poem)
      const poemPost = (recentRes.posts || []).find(
        (p) => p.content_type === 'poem' || p.content_type === 'poetry'
      )
      if (poemPost) {
        try {
          const fullPoem = await postsApi.getPost(poemPost.id)
          setPoemOfTheDay(fullPoem)
        } catch {
          // Fallback if full fetch fails
        }
      }

      // 4. Fetch trending tags
      try {
        const tags = await getTrendingTags(8)
        setTrendingTags(tags || [])
      } catch {
        // Non-critical
      }

      // 5. If user is authenticated, load personalized feed for reading progress
      if (isAuthenticated) {
        try {
          const feedData = await feedApi.getPersonalizedFeed()
          setFeed(feedData)
        } catch (err) {
          console.error('Error loading feed:', err)
        }
      }
    } catch (error) {
      console.error('Error loading homepage data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Curated writers to follow
  const curatedWriters = [
    {
      username: 'elena_vance',
      fullName: 'Elena Vance',
      bio: 'Poet & Essayist. Exploring quiet grief, coastal solitude, and the cadence of silence.',
      publicationsCount: 14,
      followersCount: 342,
    },
    {
      username: 'marcus_reid',
      fullName: 'Marcus Reid',
      bio: 'Author of historical fiction and speculative manuscripts. Writing from old library archives.',
      publicationsCount: 8,
      followersCount: 512,
    },
    {
      username: 'clara_chen',
      fullName: 'Clara Chen',
      bio: 'Literary journal editor. Fascinated by translated verses and modern lyrical minimalism.',
      publicationsCount: 22,
      followersCount: 680,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* =========================================================================
          SECTION 1: HERO SECTION
          "Some stories are read. Others are felt."
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-24 lg:pb-32 border-b border-border/60 bg-gradient-to-b from-card/60 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Editorial Headline & Copy */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-literary/10 border border-literary/20 text-xs font-sans tracking-wide text-literary font-medium">
                <Feather className="h-3.5 w-3.5" />
                <span>The Independent Literary Magazine & Studio</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground leading-[1.08]">
                Some stories are read. <br className="hidden sm:inline" />
                <span className="italic font-normal text-literary">Others are felt.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-reading max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Discover poetry, explore new worlds, and share the words only you can write. A sanctuary for deep reading, deliberate writing, and published works that endure.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center lg:justify-start items-center pt-2">
                <Link
                  to="/discover"
                  className="w-full sm:w-auto px-7 py-3.5 bg-foreground text-background rounded-full font-medium text-sm sm:text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explore stories</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/write"
                  className="w-full sm:w-auto px-7 py-3.5 bg-card border border-border hover:border-literary/50 text-foreground rounded-full font-medium text-sm sm:text-base hover:bg-muted/60 transition-all flex items-center justify-center gap-2"
                >
                  <Feather className="h-4 w-4 text-literary" />
                  <span>Start writing</span>
                </Link>
              </div>

              {/* Editorial Badges */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Distraction-free reading</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-literary" />
                  <span>Multi-chapter manuscripts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                  <span>Pure stanza preservation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Tactile Book & Manuscript Composition */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Background decorative soft blur */}
                <div className="absolute -inset-2 bg-literary/10 rounded-2xl filter blur-xl opacity-60 -z-10" />

                {/* Tactile Literary Showcase Card */}
                <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-border/60 pb-3">
                    <span className="font-serif italic">Edition № 42</span>
                    <span className="uppercase tracking-widest text-[10px] text-literary font-semibold">Ink&Echoes Press</span>
                  </div>

                  <div className="space-y-3 font-serif">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-sans">Featured Manuscript</span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      Echoes in the Pine Woods
                    </h3>
                    <p className="text-xs text-literary font-medium">By Clara Chen</p>
                  </div>

                  <p className="text-sm font-reading text-foreground/80 italic leading-relaxed pl-3 border-l-2 border-literary/40">
                    &ldquo;There is a threshold where morning mist becomes breath, and the trees keep the quiet counsel of everything we left unsaid.&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>Chapter I — The Clearing</span>
                    <span className="font-sans font-semibold text-foreground">7 min read</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          AUTHENTICATED SHELF: CONTINUE READING (IF LOGGED IN)
         ========================================================================= */}
      {isAuthenticated && feed?.current_reading && feed.current_reading.length > 0 && (
        <section className="py-10 border-b border-border/60 bg-card/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Bookmark className="h-5 w-5 text-literary" />
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                  Continue Reading
                </h2>
              </div>
              <Link to="/my-posts" className="text-xs sm:text-sm text-literary hover:underline font-medium">
                View all in library &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {feed.current_reading.map((item) => (
                <BookCard
                  key={item.post.id}
                  post={item.post}
                  showProgress={true}
                  progressPercentage={item.progress.progress_percentage}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: EDITOR'S PICKS
          Curated books, poems, and stories with consistent content cards
         ========================================================================= */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-3">
          <div>
            <span className="text-xs font-sans uppercase tracking-widest text-literary font-semibold">
              Curated Selections
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
              Editor&apos;s Picks
            </h2>
          </div>
          <Link
            to="/discover?sort=appreciated"
            className="text-sm text-literary hover:text-literary-hover font-medium inline-flex items-center gap-1"
          >
            <span>Browse curated catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-muted/50 rounded-xl" />
            ))}
          </div>
        ) : editorPicks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {editorPicks.slice(0, 6).map((post) => {
              if (post.content_type === 'book') {
                return <BookCard key={post.id} post={post} />
              }
              if (post.content_type === 'poem' || post.content_type === 'poetry') {
                return <PoemCard key={post.id} post={post} />
              }
              return <StoryCard key={post.id} post={post} />
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground text-sm">Selections will appear here as works are appreciated.</p>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: POEM OF THE DAY
          Dedicated editorial presentation for a featured poem
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-card/60 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1 text-xs font-sans uppercase tracking-widest text-terracotta font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Poem of the Day</span>
            </span>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-8 sm:p-12 shadow-sm relative">
            <Quote className="h-10 w-10 text-literary/15 absolute top-6 left-6" />

            <div className="text-center max-w-xl mx-auto space-y-6">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                {poemOfTheDay ? poemOfTheDay.title : 'Autumn Solstice'}
              </h3>

              {poemOfTheDay?.author_username && (
                <p className="text-sm font-serif italic text-muted-foreground">
                  By {poemOfTheDay.author_username}
                </p>
              )}

              {/* Poem Stanzas — Preserving pure line breaks and spacing */}
              <div className="my-8 font-reading text-base sm:text-lg text-foreground/90 italic leading-relaxed space-y-4">
                {poemOfTheDay && poemOfTheDay.content?.body ? (
                  <div
                    className="prose prose-sm sm:prose-base max-w-none font-reading italic text-foreground"
                    dangerouslySetInnerHTML={{ __html: poemOfTheDay.content.body }}
                  />
                ) : (
                  <>
                    <p>
                      The maple turns in silence,<br />
                      shedding gold upon the stone.<br />
                      No petition in the falling,<br />
                      no hesitation known.
                    </p>
                    <p>
                      And in the amber twilight,<br />
                      where the cold begins to cling,<br />
                      we learn the peace of winter<br />
                      before we dream of spring.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-center gap-4">
                {poemOfTheDay ? (
                  <Link
                    to={`/post/${poemOfTheDay.slug}`}
                    className="text-sm font-medium text-literary hover:text-literary-hover flex items-center gap-1.5"
                  >
                    <span>Read full poem</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/discover?type=poem"
                    className="text-sm font-medium text-literary hover:text-literary-hover flex items-center gap-1.5"
                  >
                    <span>Explore poetry library</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: EXPLORE THE LIBRARY
          Curated collections, genre categories, and library taxonomy
         ========================================================================= */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-sans uppercase tracking-widest text-literary font-semibold">
            Catalog & Genres
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
            Explore the Library
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Immerse yourself in diverse literary forms, curated by form and genre.
          </p>
        </div>

        {/* Form Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <Link
            to="/discover?type=poem"
            className="group p-6 bg-card border border-border rounded-xl hover:border-literary/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-literary transition-colors">
                Poetry & Verses
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Stanzas, lyrical compositions, and free verse formatted for quiet contemplation.
              </p>
            </div>
            <div className="mt-4 text-xs font-medium text-literary flex items-center gap-1">
              <span>Browse poetry</span>
              <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>

          <Link
            to="/discover?type=book"
            className="group p-6 bg-card border border-border rounded-xl hover:border-literary/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-literary/10 text-literary flex items-center justify-center mb-4">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-literary transition-colors">
                Books & Novellas
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Multi-chapter manuscripts, complete books, and sequential serials.
              </p>
            </div>
            <div className="mt-4 text-xs font-medium text-literary flex items-center gap-1">
              <span>Browse books</span>
              <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>

          <Link
            to="/discover?type=journal"
            className="group p-6 bg-card border border-border rounded-xl hover:border-literary/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-emerald-600/10 text-emerald-700 flex items-center justify-center mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-literary transition-colors">
                Literary Journals
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Personal entries, reflections, and field notes penned across seasons.
              </p>
            </div>
            <div className="mt-4 text-xs font-medium text-literary flex items-center gap-1">
              <span>Browse journals</span>
              <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>

          <Link
            to="/discover?type=story"
            className="group p-6 bg-card border border-border rounded-xl hover:border-literary/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-700 flex items-center justify-center mb-4">
                <Feather className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-literary transition-colors">
                Short Stories
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Complete narratives and essays designed for a single immersive sitting.
              </p>
            </div>
            <div className="mt-4 text-xs font-medium text-literary flex items-center gap-1">
              <span>Browse stories</span>
              <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>
        </div>

        {/* Trending Literary Tags */}
        {trendingTags.length > 0 && (
          <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-2 font-sans">
              Trending Themes:
            </span>
            {trendingTags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.slug}`}
                className="px-3 py-1 bg-secondary text-secondary-foreground hover:bg-literary/15 hover:text-literary rounded-full text-xs font-medium transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 5: RECENTLY PUBLISHED
          Show recent publications in a visually consistent layout
         ========================================================================= */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-3">
          <div>
            <span className="text-xs font-sans uppercase tracking-widest text-literary font-semibold">
              Fresh Off the Press
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
              Recently Published
            </h2>
          </div>
          <Link
            to="/discover?sort=latest"
            className="text-sm text-literary hover:text-literary-hover font-medium inline-flex items-center gap-1"
          >
            <span>View all new publications</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recentPosts.slice(0, 6).map((post) => {
              if (post.content_type === 'book') {
                return <BookCard key={post.id} post={post} />
              }
              if (post.content_type === 'poem' || post.content_type === 'poetry') {
                return <PoemCard key={post.id} post={post} />
              }
              return <StoryCard key={post.id} post={post} />
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No publications found yet. Be the first to share your words!
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 6: WRITERS TO FOLLOW
          Display author portraits, names, brief descriptions, and follow actions
         ========================================================================= */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border/60 bg-card/30">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-3">
          <div>
            <span className="text-xs font-sans uppercase tracking-widest text-literary font-semibold">
              The Literary Guild
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mt-1">
              Writers to Follow
            </h2>
          </div>
          <Link
            to="/discover?tab=writers"
            className="text-sm text-literary hover:text-literary-hover font-medium inline-flex items-center gap-1"
          >
            <span>Discover all authors</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {curatedWriters.map((writer) => (
            <AuthorCard
              key={writer.username}
              username={writer.username}
              fullName={writer.fullName}
              bio={writer.bio}
              publicationsCount={writer.publicationsCount}
              followersCount={writer.followersCount}
            />
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CREATOR INVITATION
          "Your next story starts here."
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-card via-background to-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
          <div className="w-14 h-14 rounded-full bg-literary/15 text-literary flex items-center justify-center mx-auto border border-literary/30">
            <Feather className="h-7 w-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground">
            Your next story starts here.
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground font-reading max-w-2xl mx-auto leading-relaxed">
            Whether you begin with a four-line poem, a thoughtful journal entry, or the first chapter of an ambitious manuscript — Ink&Echoes offers you a distraction-free studio and an appreciative community.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/write"
              className="px-8 py-3.5 bg-literary text-white rounded-full font-medium text-base hover:bg-literary-hover transition-colors shadow-sm flex items-center gap-2"
            >
              <Feather className="h-4 w-4" />
              <span>Begin writing</span>
            </Link>

            <Link
              to="/discover"
              className="px-8 py-3.5 bg-card border border-border rounded-full font-medium text-base text-foreground hover:bg-muted/70 transition-colors"
            >
              Explore published manuscripts
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
