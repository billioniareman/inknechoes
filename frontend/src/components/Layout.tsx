import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import {
  Feather,
  Search,
  X,
  Mail,
  Menu,
  Rss,
  BookOpen,
  ChevronDown,
  User,
  LogOut,
  BarChart2,
  Bookmark,
  Shield,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Compass,
  FileText,
  Sparkles
} from 'lucide-react'
import { authApi } from '../api/auth'
import { useToast } from '../contexts/ToastContext'
import { useTranslation } from 'react-i18next'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'

export default function Layout() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useUserStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showWriteMenu, setShowWriteMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)

  const writeMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (writeMenuRef.current && !writeMenuRef.current.contains(event.target as Node)) {
        setShowWriteMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setShowMobileMenu(false)
    setShowWriteMenu(false)
    setShowUserMenu(false)
    setShowSearch(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSearch(false)
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) return
    setResendingVerification(true)
    try {
      await authApi.resendVerification(user.email)
      showToast('Verification email sent! Please check your inbox.', 'success')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to resend verification email'
      showToast(message, 'error')
    } finally {
      setResendingVerification(false)
    }
  }

  const isCurrent = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-literary/20 selection:text-ink">
      {/* Editorial Navigation Bar */}
      <nav className="border-b border-border/70 bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            
            {/* Brand Logo & Wordmark */}
            <Link
              to="/"
              className="flex items-center space-x-2.5 group flex-shrink-0"
              aria-label="Ink&Echoes Home"
            >
              <div className="w-9 h-9 rounded-full bg-literary/10 border border-literary/20 flex items-center justify-center text-literary group-hover:scale-105 transition-transform">
                <Feather className="h-5 w-5" />
              </div>
              <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-foreground">
                Ink<span className="text-literary">&</span>Echoes
              </span>
            </Link>

            {/* Desktop Editorial Navigation Links */}
            <div className="hidden lg:flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/discover"
                className={`transition-colors py-1 ${
                  isCurrent('/discover')
                    ? 'text-foreground font-semibold border-b-2 border-literary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('nav.discover', 'Discover')}
              </Link>
              <Link
                to="/discover?type=poem"
                className="text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Poetry
              </Link>
              <Link
                to="/discover?type=book"
                className="text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Books
              </Link>
              <Link
                to="/discover?type=journal"
                className="text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Journals
              </Link>
              <Link
                to="/discover?tab=writers"
                className="text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Writers
              </Link>
            </div>

            {/* Search Input (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search poetry, books, authors..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-border/80 rounded-full bg-background/80 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-literary focus:border-literary transition-all"
                />
              </div>
            </form>

            {/* Right Actions (Auth / Writing / Profile) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Toggle for Mobile */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden text-foreground hover:text-literary p-2 rounded-md transition-colors"
                title="Search"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Start Writing Action with Dropdown */}
              <div className="relative" ref={writeMenuRef}>
                <button
                  onClick={() => setShowWriteMenu(!showWriteMenu)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-literary text-white rounded-full hover:bg-literary-hover transition-colors font-medium text-xs sm:text-sm shadow-sm"
                  aria-expanded={showWriteMenu}
                >
                  <Feather className="h-3.5 w-3.5" />
                  <span>Start writing</span>
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>

                {showWriteMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                      Create New Work
                    </div>
                    <Link
                      to="/write?type=poem"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-terracotta" />
                      <div>
                        <div className="font-medium">Write a Poem</div>
                        <div className="text-xs text-muted-foreground">Line breaks & cadence</div>
                      </div>
                    </Link>
                    <Link
                      to="/write?type=book"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-literary" />
                      <div>
                        <div className="font-medium">Begin a Book</div>
                        <div className="text-xs text-muted-foreground">Multi-chapter manuscript</div>
                      </div>
                    </Link>
                    <Link
                      to="/write?type=journal"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="font-medium">Journal Entry</div>
                        <div className="text-xs text-muted-foreground">Personal reflections</div>
                      </div>
                    </Link>
                    <Link
                      to="/write?type=story"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Feather className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="font-medium">Short Story / Article</div>
                        <div className="text-xs text-muted-foreground">Single published piece</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Theme & Language Switchers */}
              <div className="hidden sm:flex items-center space-x-1">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>

              {/* Notification Bell (Signed-in) */}
              {isAuthenticated && <NotificationBell />}

              {/* Signed-in User Profile Dropdown */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-muted/80 transition-colors border border-border/80"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-literary/15 text-literary flex items-center justify-center font-serif font-bold text-xs sm:text-sm">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b border-border/60">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>

                      <Link
                        to={`/user/${user?.username}`}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Author Profile</span>
                      </Link>

                      <Link
                        to="/my-posts"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                        <span>My Library & Drafts</span>
                      </Link>

                      <Link
                        to="/analytics"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        <span>Creator Dashboard</span>
                      </Link>

                      {user?.is_admin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
                        >
                          <Shield className="h-4 w-4 text-terracotta" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-border/60 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-muted/70 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Signed-out Visitors */
                <div className="hidden sm:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-literary transition-colors"
                  >
                    {t('nav.signIn', 'Sign In')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-sm font-medium bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
                  >
                    {t('nav.getStarted', 'Join')}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden text-foreground hover:text-literary p-2 rounded-md transition-colors"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {showSearch && (
          <div className="border-t border-border/60 bg-card/95 p-3 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search poetry, books, authors..."
                className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-literary"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Slide-down Navigation Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-border/70 bg-card px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border/50 text-sm font-medium">
              <Link to="/discover" className="p-2 rounded-lg hover:bg-muted text-foreground">
                Discover
              </Link>
              <Link to="/discover?type=poem" className="p-2 rounded-lg hover:bg-muted text-foreground">
                Poetry
              </Link>
              <Link to="/discover?type=book" className="p-2 rounded-lg hover:bg-muted text-foreground">
                Books
              </Link>
              <Link to="/discover?type=journal" className="p-2 rounded-lg hover:bg-muted text-foreground">
                Journals
              </Link>
              <Link to="/discover?tab=writers" className="p-2 rounded-lg hover:bg-muted text-foreground">
                Writers
              </Link>
              <Link to="/my-posts" className="p-2 rounded-lg hover:bg-muted text-foreground">
                My Library
              </Link>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-foreground">Reading Theme</span>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-foreground">Language</span>
              <LanguageSwitcher />
            </div>

            {!isAuthenticated && (
              <div className="pt-2 flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 py-2 text-center text-sm font-medium border border-border rounded-lg text-foreground hover:bg-muted"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 py-2 text-center text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90"
                >
                  Join Ink&Echoes
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Email Verification Banner */}
      {isAuthenticated && user && !user.email_verified && (
        <div className="bg-sage/40 border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-4 w-4 text-literary flex-shrink-0" />
              <p className="text-foreground truncate font-medium">
                Please verify your email address to unlock full literary publishing.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="text-literary hover:underline font-medium disabled:opacity-50"
              >
                {resendingVerification ? 'Sending...' : 'Resend link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-grow pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Persistent Reader & Writer Shortcut) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/70 flex justify-around items-center h-14 px-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs ${
            isCurrent('/') ? 'text-literary font-semibold' : 'text-muted-foreground'
          }`}
        >
          <HomeIcon className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <Link
          to="/discover"
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs ${
            isCurrent('/discover') ? 'text-literary font-semibold' : 'text-muted-foreground'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Discover</span>
        </Link>
        <Link
          to="/write"
          className="flex flex-col items-center justify-center w-12 h-12 -mt-4 bg-literary text-white rounded-full shadow-lg"
          aria-label="Write"
        >
          <Feather className="h-5 w-5" />
        </Link>
        <Link
          to={isAuthenticated ? '/my-posts' : '/login'}
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs ${
            isCurrent('/my-posts') ? 'text-literary font-semibold' : 'text-muted-foreground'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Library</span>
        </Link>
        <Link
          to={isAuthenticated ? `/user/${user?.username}` : '/login'}
          className={`flex flex-col items-center justify-center w-14 py-1 text-xs ${
            isAuthenticated && location.pathname.startsWith('/user/')
              ? 'text-literary font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </div>

      {/* Comprehensive Literary Footer */}
      <footer className="border-t border-border/70 bg-card/70 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-literary/10 border border-literary/20 flex items-center justify-center text-literary">
                  <Feather className="h-4 w-4" />
                </div>
                <span className="text-xl font-serif font-bold text-foreground">
                  Ink<span className="text-literary">&</span>Echoes
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                A modern sanctuary for readers, poets, and independent authors. Where stories find their echo and words endure.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/rss/global`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-literary border border-border px-3 py-1.5 rounded-full transition-colors"
                >
                  <Rss className="h-3.5 w-3.5" />
                  <span>RSS Publication Feed</span>
                </a>
              </div>
            </div>

            {/* Discover Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground mb-3 font-sans">
                Discover
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/discover?type=poem" className="hover:text-foreground transition-colors">Poetry</Link></li>
                <li><Link to="/discover?type=book" className="hover:text-foreground transition-colors">Books & Manuscripts</Link></li>
                <li><Link to="/discover?type=journal" className="hover:text-foreground transition-colors">Literary Journals</Link></li>
                <li><Link to="/discover?type=story" className="hover:text-foreground transition-colors">Short Stories</Link></li>
                <li><Link to="/discover?tab=writers" className="hover:text-foreground transition-colors">Featured Writers</Link></li>
              </ul>
            </div>

            {/* Publishing Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground mb-3 font-sans">
                Publishing
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/write" className="hover:text-foreground transition-colors">Writer's Studio</Link></li>
                <li><Link to="/write?type=book" className="hover:text-foreground transition-colors">Manuscript Editor</Link></li>
                <li><Link to="/my-posts" className="hover:text-foreground transition-colors">Drafts & Revisions</Link></li>
                <li><Link to="/analytics" className="hover:text-foreground transition-colors">Reader Analytics</Link></li>
                <li><Link to="/settings" className="hover:text-foreground transition-colors">Author Pen Name</Link></li>
              </ul>
            </div>

            {/* Platform & Community */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground mb-3 font-sans">
                Community
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/discover" className="hover:text-foreground transition-colors">Editorial Guidelines</Link></li>
                <li><Link to="/discover" className="hover:text-foreground transition-colors">Reader Library</Link></li>
                <li><Link to="/settings" className="hover:text-foreground transition-colors">Account Security</Link></li>
                <li><Link to="/discover" className="hover:text-foreground transition-colors">Privacy & Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/70 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
            <p>© {new Date().getFullYear()} Ink&Echoes. All literary rights reserved to respective authors.</p>
            <p className="font-serif italic">Crafted for the love of words and literature.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
