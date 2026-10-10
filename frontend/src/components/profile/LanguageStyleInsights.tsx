import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface LanguageStyleInsightsProps {
  insights: {
    most_frequent_words: Array<{ word: string; count: number }>
    sentence_complexity: {
      average_sentence_length: number
      readability_index: number
    }
    unique_vocabulary_ratio: number
    emotion_analysis: Record<string, number>
    lexical_diversity: Array<{ month: string; diversity_score: number }>
  }
}

export default function LanguageStyleInsights({ insights }: LanguageStyleInsightsProps) {
  // Convert emotion analysis to array for radar chart
  const emotionData = Object.entries(insights.emotion_analysis || {}).map(([emotion, value]) => ({
    emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    value
  }))

  // Convert lexical diversity to array for chart
  const diversityData = insights.lexical_diversity || []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6">Language & Style Insights</h2>

      {/* Sentence Complexity */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Sentence Complexity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="text-center p-5 bg-secondary/40 rounded-xl border border-border/60">
            <p className="text-xs font-sans tracking-wide uppercase text-muted-foreground mb-2">Average Sentence Length</p>
            <p className="text-3xl font-serif font-bold text-foreground">{insights.sentence_complexity.average_sentence_length}</p>
            <p className="text-xs text-muted-foreground mt-1">words per sentence</p>
          </div>
          <div className="text-center p-5 bg-secondary/40 rounded-xl border border-border/60">
            <p className="text-xs font-sans tracking-wide uppercase text-muted-foreground mb-2">Readability Index</p>
            <p className="text-3xl font-serif font-bold text-foreground">{insights.sentence_complexity.readability_index}</p>
            <p className="text-xs text-muted-foreground mt-1">Flesch-Kincaid score</p>
          </div>
        </div>
      </div>

      {/* Unique Vocabulary Ratio */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
        <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Vocabulary Richness</h3>
        <div className="text-center py-2">
          <p className="text-4xl font-serif font-bold text-foreground">{insights.unique_vocabulary_ratio}%</p>
          <p className="text-muted-foreground text-sm mt-1">Unique vocabulary ratio</p>
          <div className="mt-4 w-full max-w-md mx-auto bg-secondary rounded-full h-3 overflow-hidden border border-border/50">
            <div
              className="bg-literary h-3 rounded-full transition-all"
              style={{ width: `${Math.min(insights.unique_vocabulary_ratio, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Emotion Analysis */}
      {emotionData.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Emotional Tone Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={emotionData}>
              <PolarGrid stroke="currentColor" className="text-border/40" />
              <PolarAngleAxis dataKey="emotion" stroke="currentColor" className="text-muted-foreground text-xs" />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} stroke="currentColor" className="text-muted-foreground text-xs" />
              <Radar
                name="Emotions"
                dataKey="value"
                stroke="#826449"
                fill="#826449"
                fillOpacity={0.4}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Most Frequent Words */}
      {insights.most_frequent_words.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Most Frequent Words</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.most_frequent_words.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="word" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <Tooltip />
              <Bar dataKey="count" fill="#826449" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lexical Diversity Over Time */}
      {diversityData.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Lexical Diversity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diversityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <Tooltip />
              <Bar dataKey="diversity_score" fill="#B85C45" name="Diversity Score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

