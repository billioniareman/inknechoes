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

const COLORS = ['#d97706', '#92400e', '#78350f', '#451a03', '#a16207']

export default function WritingAnalytics({ analytics }: WritingAnalyticsProps) {
  // Convert productivity object to array for chart
  const productivityData = Object.entries(analytics.productivity || {})
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif font-bold text-amber-900 mb-6">Writing Analytics</h2>

      {/* Genre Distribution */}
      <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Genre Distribution</h3>
        {analytics.genre_distribution.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.genre_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { genre: string; percentage: number }) => `${entry.genre}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
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
                <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                  <span className="font-medium text-amber-900">{item.genre}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-700">{item.count} posts</span>
                    <span className="text-sm font-semibold text-amber-800">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-amber-700">No genre data available</p>
        )}
      </div>

      {/* Productivity Chart */}
      {productivityData.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Writing Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a574" />
              <XAxis dataKey="month" stroke="#92400e" />
              <YAxis stroke="#92400e" />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
              <Legend />
              <Bar dataKey="count" fill="#d97706" name="Posts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sentiment Trend */}
      {analytics.sentiment_trend.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.sentiment_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a574" />
              <XAxis dataKey="month" stroke="#92400e" />
              <YAxis stroke="#92400e" />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
              <Legend />
              <Line type="monotone" dataKey="post_count" stroke="#d97706" name="Posts" strokeWidth={2} />
              <Line type="monotone" dataKey="avg_engagement" stroke="#92400e" name="Avg Engagement" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Word Frequency Cloud */}
      {analytics.word_frequency.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Most Frequent Words</h3>
          <div className="flex flex-wrap gap-3">
            {analytics.word_frequency.slice(0, 20).map((item, idx) => (
              <div
                key={idx}
                className="px-4 py-2 bg-amber-100 text-amber-900 rounded-full border border-amber-200"
                style={{
                  fontSize: `${Math.min(12 + item.count * 2, 24)}px`,
                  fontWeight: item.count > 5 ? 'bold' : 'normal'
                }}
              >
                {item.word} ({item.count})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Article Length */}
      <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Average Article Length</h3>
        <div className="text-center">
          <p className="text-4xl font-bold text-amber-900">{analytics.average_article_length.toLocaleString()}</p>
          <p className="text-amber-700 mt-2">words per post</p>
        </div>
      </div>

      {/* Top Performing Posts */}
      {analytics.top_performing.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {analytics.top_performing.map((post) => (
              <div key={post.id} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">{post.title}</h4>
                <div className="flex gap-4 text-sm text-amber-700">
                  <span>❤️ {post.likes} likes</span>
                  <span>👏 {post.claps} claps</span>
                  <span className="font-semibold">Total: {post.total_engagement}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

