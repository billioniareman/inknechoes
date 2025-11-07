import { useEffect, useState } from 'react'
import { adminApi, AdminStats, User, Post, Comment } from '../api/admin'
import { useUserStore } from '../store/userStore'
import { Navigate } from 'react-router-dom'

export default function Admin() {
  const { user } = useUserStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'comments'>('stats')

  useEffect(() => {
    if (user?.is_admin) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, usersData, postsData, commentsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getPosts(),
        adminApi.getComments(),
      ])
      setStats(statsData)
      setUsers(usersData)
      setPosts(postsData)
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await adminApi.deleteUser(userId)
      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await adminApi.deletePost(postId)
      setPosts(posts.filter((p) => p.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    try {
      await adminApi.deleteComment(commentId)
      setComments(comments.filter((c) => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    }
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-serif font-bold mb-8">Admin Portal</h1>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex space-x-8">
          {(['stats', 'users', 'posts', 'comments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Users</h3>
              <p className="text-3xl font-bold">{stats.total_users}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Posts</h3>
              <p className="text-3xl font-bold">{stats.total_posts}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Comments</h3>
              <p className="text-3xl font-bold">{stats.total_comments}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Engagement</h3>
              <p className="text-3xl font-bold">{stats.total_likes + stats.total_claps}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-serif font-bold mb-4">Recent Activity (Last 7 Days)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">New Users</p>
                <p className="text-2xl font-bold">{stats.recent_activity.users_last_7_days}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Posts</p>
                <p className="text-2xl font-bold">{stats.recent_activity.posts_last_7_days}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Comments</p>
                <p className="text-2xl font-bold">{stats.recent_activity.comments_last_7_days}</p>
              </div>
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-serif font-bold mb-4">Content Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Poetry</p>
                <p className="text-2xl font-bold">{stats.content_breakdown.poetry}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Books</p>
                <p className="text-2xl font-bold">{stats.content_breakdown.book}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Articles</p>
                <p className="text-2xl font-bold">{stats.content_breakdown.article}</p>
              </div>
            </div>
          </div>

          {/* Top Authors */}
          {stats.top_authors.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-serif font-bold mb-4">Top Authors</h2>
              <div className="space-y-2">
                {stats.top_authors.map((author, idx) => (
                  <div key={author.username} className="flex justify-between items-center">
                    <span className="font-medium">
                      {idx + 1}. {author.username}
                    </span>
                    <span className="text-muted-foreground">{author.post_count} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.is_admin && (
                        <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!user.is_admin && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Engagement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{post.id}</td>
                    <td className="px-6 py-4">{post.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                        {post.content_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">❤️ {post.likes_count} 👏 {post.claps_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Likes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{comment.id}</td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2">{comment.content}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{comment.likes_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

