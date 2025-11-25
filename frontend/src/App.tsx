import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import React from 'react'
import { useUserStore } from './store/userStore'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ToastContainer from './components/ToastContainer'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Write from './pages/Write'
import PostView from './pages/PostView'
import Profile from './pages/Profile'
import Discover from './pages/Discover'
import MyPosts from './pages/MyPosts'
import Admin from './pages/Admin'
import VerifyEmail from './pages/VerifyEmail'
import Settings from './pages/Settings'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Followers from './pages/Followers'
import Following from './pages/Following'
import Notifications from './pages/Notifications'
import BrowseByTag from './pages/BrowseByTag'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useUserStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public route component (redirects to home if already authenticated)
function PublicRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useUserStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { fetchUser } = useUserStore()

  useEffect(() => {
    // Fetch user on mount to check authentication status
    // Silently handle errors - 401 is expected when not logged in
    fetchUser().catch(() => {
      // User is not logged in - this is fine
    })
  }, [fetchUser])

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="discover" element={<Discover />} />
              <Route path="tags/:tagSlug" element={<BrowseByTag />} />
              <Route
                path="login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="post/:slug" element={<PostView />} />
              <Route path="user/:username" element={<Profile />} />
              <Route
                path="write"
                element={
                  <ProtectedRoute>
                    <Write />
                  </ProtectedRoute>
                }
              />
              <Route
                path="write/:postId"
                element={
                  <ProtectedRoute>
                    <Write />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-posts"
                element={
                  <ProtectedRoute>
                    <MyPosts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="user/:username/followers"
                element={
                  <ProtectedRoute>
                    <Followers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="user/:username/following"
                element={
                  <ProtectedRoute>
                    <Following />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App

