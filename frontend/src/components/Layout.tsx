import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { LogOut, PenTool, User, Search, X, Mail, Menu } from 'lucide-react'
import { authApi } from '../api/auth'
import { useToast } from '../contexts/ToastContext'

export default function Layout() {
  const { user, isAuthenticated, logout } = useUserStore()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)

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

  const handleDismissVerificationBanner = () => {
    // Store dismissal in localStorage (optional - can be improved)
    localStorage.setItem('email_verification_dismissed', 'true')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 group flex-shrink-0" onClick={() => setShowMobileMenu(false)}>
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:opacity-80 transition-opacity" />
              <span className="text-lg sm:text-xl font-serif font-bold text-foreground">
                Ink<span className="text-primary">&</span>Echoes
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-amber-200 rounded-lg bg-white/80 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </form>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link
                to="/discover"
                className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base"
              >
                Discover
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/write"
                    className="px-3 lg:px-4 py-1.5 lg:py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium text-sm lg:text-base"
                  >
                    Write
                  </Link>
                  <Link
                    to="/my-posts"
                    className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base"
                  >
                    My Posts
                  </Link>
                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to={`/user/${user?.username}`}
                    className="flex items-center space-x-1.5 lg:space-x-2 text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base"
                  >
                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>{user?.username}</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base"
                    title="Settings"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-foreground hover:text-primary transition-colors p-1"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-foreground hover:text-primary transition-colors font-medium text-sm lg:text-base"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 lg:px-4 py-1.5 lg:py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium text-sm lg:text-base"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => {
                  setShowSearch(!showSearch)
                  setShowMobileMenu(false)
                }}
                className="text-foreground hover:text-primary transition-colors p-2"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-foreground hover:text-primary transition-colors p-2"
                title="Menu"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border/50 bg-white">
            <div className="px-3 py-3 space-y-2">
              <Link
                to="/discover"
                onClick={() => setShowMobileMenu(false)}
                className="block px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium"
              >
                Discover
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/write"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
                  >
                    Write
                  </Link>
                  <Link
                    to="/my-posts"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium"
                  >
                    My Posts
                  </Link>
                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to={`/user/${user?.username}`}
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.username}</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowMobileMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 text-foreground hover:text-primary hover:bg-amber-50 rounded-md transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Email Verification Banner */}
      {isAuthenticated && user && !user.email_verified && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-amber-900 truncate">
                    Please verify your email address
                  </p>
                  <p className="text-xs text-amber-700 hidden sm:block">
                    Check your inbox for the verification link
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="text-xs sm:text-sm text-amber-700 hover:text-amber-900 font-medium disabled:opacity-50 whitespace-nowrap px-1 sm:px-2 py-1"
                >
                  {resendingVerification ? 'Sending...' : 'Resend'}
                </button>
                <Link
                  to="/verify-email"
                  className="text-xs sm:text-sm text-amber-700 hover:text-amber-900 font-medium whitespace-nowrap px-1 sm:px-2 py-1"
                >
                  Verify
                </Link>
                <button
                  onClick={handleDismissVerificationBanner}
                  className="text-amber-600 hover:text-amber-800 p-1"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="border-b border-border/50 bg-white/90 backdrop-blur-sm md:hidden">
          <div className="max-w-7xl mx-auto px-3 py-2.5">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full pl-10 pr-10 py-2.5 text-base border border-amber-200 rounded-lg bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 mb-4 sm:mb-0">
              <PenTool className="h-5 w-5 text-primary" />
              <span className="text-lg font-serif font-bold text-foreground">
                Ink<span className="text-primary">&</span>Echoes
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2025 Ink&Echoes. A platform for writers and readers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

