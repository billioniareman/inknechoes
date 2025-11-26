import { useEffect, useState } from 'react'
import { analyticsApi, AuthorAnalyticsStats } from '../api/analytics'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Eye, Heart, MessageSquare, Clock } from 'lucide-react'

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<AuthorAnalyticsStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState(30) // days

    useEffect(() => {
        loadStats()
    }, [timeRange])

    const loadStats = async () => {
        try {
            setLoading(true)
            const data = await analyticsApi.getMyStats(timeRange)
            setStats(data)
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-foreground">
                    Analytics Dashboard
                </h1>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 3 months</option>
                </select>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
                        <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats.total_views.toLocaleString()}</div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Likes</h3>
                        <Heart className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats.total_likes.toLocaleString()}</div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Comments</h3>
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stats.total_comments.toLocaleString()}</div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Avg. Time Spent</h3>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {Math.round(stats.avg_time_spent)}s
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-foreground">Views Over Time</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.views_chart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-foreground">Top Performing Posts</h3>
                    <div className="space-y-4">
                        {stats.top_posts.map((post, index) => (
                            <div key={post.slug} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium text-foreground truncate max-w-[150px]" title={post.title}>
                                        {post.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Eye className="h-3 w-3" />
                                    <span>{post.views}</span>
                                </div>
                            </div>
                        ))}
                        {stats.top_posts.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No posts yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
