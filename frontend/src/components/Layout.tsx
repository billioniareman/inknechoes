import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useUserStore } from '../store/userStore'
import { LogOut, PenTool, User, Search, X } from 'lucide-react'

export default function Layout() {
  const { user, isAuthenticated, logout } = useUserStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
              <PenTool className="h-6 w-6 text-primary group-hover:opacity-80 transition-opacity" />
              <span className="text-xl font-serif font-bold text-foreground">
                Ink<span className="text-primary">&</span>Echoes
              </span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stories..."
                  className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg bg-white/80 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </form>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden text-foreground hover:text-primary transition-colors"
              title="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-6">
              <Link
                to="/discover"
                className="text-foreground hover:text-primary transition-colors font-medium hidden sm:block"
              >
                Discover
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/write"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
                  >
                    Write
                  </Link>
                  <Link
                    to="/my-posts"
                    className="text-foreground hover:text-primary transition-colors font-medium hidden md:block"
                  >
                    My Posts
                  </Link>
                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      className="text-foreground hover:text-primary transition-colors font-medium hidden md:block"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to={`/user/${user?.username}`}
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors font-medium"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-foreground hover:text-primary transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-foreground hover:text-primary transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="border-b border-border/50 bg-white/90 backdrop-blur-sm md:hidden">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full pl-10 pr-10 py-2 border border-amber-200 rounded-lg bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-600 hover:text-amber-800"
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

