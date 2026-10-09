import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface WritingAnalyticsProps {
  analytics: {
    genre_distribution: Array<{ genre: string; count: number; percentage: number }>
    sentiment_trend: Array<{ month: string; post_count: number; avg_engagement: number }>
    word_frequency: Array<{ word: string; count: number }>
    average_article_length: number
    productivity: Record<string, number>
    top_performing: Array<{
      id: number
      title: string
      slug: string
      likes: number
      claps: number
      total_engagement: number
      created_at?: string
    }>
    evolution_timeline: Array<{
      date: string
      title: string
      engagement: number
      word_count: number
    }>
  }
}

const COLORS = ['#826449', '#B85C45', '#6B7F67', '#506575', '#A88B74']

export default function WritingAnalytics({ analytics }: WritingAnalyticsProps) {
  // Convert productivity object to array for chart
  const productivityData = Object.entries(analytics.productivity || {})
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6">Writing Analytics</h2>

      {/* Genre Distribution */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Genre Distribution</h3>
        {analytics.genre_distribution.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.genre_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { genre: string; percentage: number }) => `${entry.genre}: ${entry.percentage}%`}
                  outerRadius={80}
                  dataKey="count"
                >
                  {analytics.genre_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {analytics.genre_distribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
                  <span className="font-medium text-foreground">{item.genre}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{item.count} publications</span>
                    <span className="text-xs font-semibold text-literary">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No genre distribution data available yet.</p>
        )}
      </div>

      {/* Productivity Chart */}
      {productivityData.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Writing Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#826449" name="Publications" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sentiment Trend */}
      {analytics.sentiment_trend.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.sentiment_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="post_count" stroke="#826449" name="Posts" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="avg_engagement" stroke="#B85C45" name="Avg Engagement" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Word Frequency Cloud */}
      {analytics.word_frequency.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Most Frequent Words</h3>
          <div className="flex flex-wrap gap-2.5">
            {analytics.word_frequency.slice(0, 20).map((item, idx) => (
              <div
                key={idx}
                className="px-3.5 py-1.5 bg-secondary text-secondary-foreground rounded-full border border-border/70"
                style={{
                  fontSize: `${Math.min(12 + item.count * 1.5, 20)}px`,
                  fontWeight: item.count > 5 ? 600 : 400
                }}
              >
                {item.word} <span className="opacity-60 text-xs">({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Article Length */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Average Publication Length</h3>
        <div className="text-center py-4">
          <p className="text-4xl font-serif font-bold text-foreground">{analytics.average_article_length.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm mt-1.5">words per publication</p>
        </div>
      </div>

      {/* Top Performing Posts */}
      {analytics.top_performing.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Top Performing Publications</h3>
          <div className="space-y-3">
            {analytics.top_performing.map((post) => (
              <div key={post.id} className="p-4 bg-secondary/40 rounded-xl border border-border/60">
                <h4 className="font-serif font-semibold text-foreground mb-1.5">{post.title}</h4>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>❤️ {post.likes} likes</span>
                  <span>👏 {post.claps} claps</span>
                  <span className="font-medium text-foreground">Total: {post.total_engagement}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

