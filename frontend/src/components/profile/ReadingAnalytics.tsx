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
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6">Reading Analytics</h2>

      {/* Genres Read Most */}
      {analytics.genres_read_most.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Genres Read Most</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.genres_read_most}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="genre" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#826449" name="Reads & Notes" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reading Time Trend */}
      {analytics.reading_time_trend.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Reading Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.reading_time_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#826449" name="Interactions" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Most Read Authors */}
      {analytics.most_read_authors.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Most Read Authors</h3>
          <div className="space-y-3">
            {analytics.most_read_authors.map((author, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-literary/15 border border-border/60 flex items-center justify-center text-literary font-serif font-bold">
                    {author.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-serif font-semibold text-foreground">{author.username}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{author.count} interactions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Reading Depth */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Average Reading Depth</h3>
        <div className="text-center py-4">
          <p className="text-4xl font-serif font-bold text-foreground">{analytics.average_reading_depth}%</p>
          <p className="text-muted-foreground text-sm mt-1.5">of publication completed on average</p>
        </div>
      </div>
    </div>
  )
}

