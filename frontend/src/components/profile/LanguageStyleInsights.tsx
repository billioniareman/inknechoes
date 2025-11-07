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
      <h2 className="text-3xl font-serif font-bold text-amber-900 mb-6">Language & Style Insights</h2>

      {/* Sentence Complexity */}
      <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Sentence Complexity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700 mb-2">Average Sentence Length</p>
            <p className="text-3xl font-bold text-amber-900">{insights.sentence_complexity.average_sentence_length}</p>
            <p className="text-xs text-amber-600 mt-1">words per sentence</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700 mb-2">Readability Index</p>
            <p className="text-3xl font-bold text-amber-900">{insights.sentence_complexity.readability_index}</p>
            <p className="text-xs text-amber-600 mt-1">Flesch-Kincaid score</p>
          </div>
        </div>
      </div>

      {/* Unique Vocabulary Ratio */}
      <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Vocabulary Richness</h3>
        <div className="text-center">
          <p className="text-4xl font-bold text-amber-900">{insights.unique_vocabulary_ratio}%</p>
          <p className="text-amber-700 mt-2">Unique vocabulary ratio</p>
          <div className="mt-4 w-full bg-amber-200 rounded-full h-4">
            <div
              className="bg-amber-600 h-4 rounded-full transition-all"
              style={{ width: `${Math.min(insights.unique_vocabulary_ratio, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Emotion Analysis */}
      {emotionData.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Emotion Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={emotionData}>
              <PolarGrid stroke="#d4a574" />
              <PolarAngleAxis dataKey="emotion" stroke="#92400e" />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} stroke="#92400e" />
              <Radar
                name="Emotions"
                dataKey="value"
                stroke="#d97706"
                fill="#d97706"
                fillOpacity={0.6}
              />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Most Frequent Words */}
      {insights.most_frequent_words.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Most Frequent Words</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.most_frequent_words.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a574" />
              <XAxis dataKey="word" stroke="#92400e" />
              <YAxis stroke="#92400e" />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
              <Bar dataKey="count" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lexical Diversity Over Time */}
      {diversityData.length > 0 && (
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Lexical Diversity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diversityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4a574" />
              <XAxis dataKey="month" stroke="#92400e" />
              <YAxis stroke="#92400e" />
              <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #d97706' }} />
              <Bar dataKey="diversity_score" fill="#d97706" name="Diversity Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

