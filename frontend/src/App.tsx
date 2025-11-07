import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import React from 'react'
import { useUserStore } from './store/userStore'
import { ToastProvider } from './contexts/ToastContext'
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
        </Route>
      </Routes>
    </Router>
    </ToastProvider>
  )
}

export default App

