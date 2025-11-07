import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface ReadingAnalyticsProps {
  analytics: {
    genres_read_most: Array<{ genre: string; count: number }>
    reading_time_trend: Array<{ month: string; count: number }>
    most_read_authors: Array<{ username: string; count: number }>
    average_reading_depth: number
    favorite_tone: Record<string, number>
    recency_vs_repetition: Record<string, number>
  }
}

export default function ReadingAnalytics({ analytics }: ReadingAnalyticsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif font-bold text-amber-900 mb-6">Reading Analytics</h2>

      {/* Genres Read Most */}
      {analytics.genres_read_most.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Genres Read Most</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.genres_read_most}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a574" />
              <XAxis dataKey="genre" stroke="#92400e" />
              <YAxis stroke="#92400e" />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
              <Legend />
              <Bar dataKey="count" fill="#d97706" name="Comments/Reads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reading Time Trend */}
      {analytics.reading_time_trend.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Reading Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.reading_time_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a574" />
              <XAxis dataKey="month" stroke="#92400e" />
              <YAxis stroke="#92400e" />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#d97706" name="Interactions" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Most Read Authors */}
      {analytics.most_read_authors.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Most Read Authors</h3>
          <div className="space-y-3">
            {analytics.most_read_authors.map((author, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                    {author.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-amber-900">{author.username}</span>
                </div>
                <span className="text-amber-700 font-medium">{author.count} interactions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Reading Depth */}
      <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Average Reading Depth</h3>
        <div className="text-center">
          <p className="text-4xl font-bold text-amber-900">{analytics.average_reading_depth}%</p>
          <p className="text-amber-700 mt-2">of content completed</p>
        </div>
      </div>
    </div>
  )
}

