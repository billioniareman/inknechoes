import { useEffect, useState } from 'react'

interface ActivityHeatmapProps {
  posts: Array<{ created_at?: string }>
}

export default function ActivityHeatmap({ posts }: ActivityHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number; level: number }>>([])

  useEffect(() => {
    // Generate last 365 days
    const today = new Date()
    const days: Record<string, number> = {}
    
    // Initialize all days with 0
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days[dateStr] = 0
    }
    
    // Count posts per day
    posts.forEach(post => {
      if (post.created_at) {
        const dateStr = new Date(post.created_at).toISOString().split('T')[0]
        if (days[dateStr] !== undefined) {
          days[dateStr]++
        }
      }
    })
    
    // Convert to array and calculate levels
    const data = Object.entries(days).map(([date, count]) => ({
      date,
      count,
      level: count === 0 ? 0 : Math.min(Math.ceil(count / 2) + 1, 4) // 0-4 levels
    })).reverse() // Most recent first
    
    setHeatmapData(data)
  }, [posts])

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-amber-50'
      case 1: return 'bg-amber-200'
      case 2: return 'bg-amber-400'
      case 3: return 'bg-amber-600'
      case 4: return 'bg-amber-800'
      default: return 'bg-amber-50'
    }
  }

  // Group by weeks (52 weeks)
  const weeks: Array<Array<{ date: string; count: number; level: number }>> = []
  for (let i = 0; i < 52; i++) {
    const weekStart = i * 7
    weeks.push(heatmapData.slice(weekStart, weekStart + 7))
  }

  return (
    <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-serif font-semibold text-amber-900 mb-4">Writing Activity Heatmap</h3>
      <div className="flex gap-1 overflow-x-auto pb-4">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={`w-3 h-3 rounded ${getColor(day.level)} border border-amber-200/30`}
                title={`${day.date}: ${day.count} posts`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-amber-700">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200/30"></div>
          <div className="w-3 h-3 rounded bg-amber-200 border border-amber-200/30"></div>
          <div className="w-3 h-3 rounded bg-amber-400 border border-amber-200/30"></div>
          <div className="w-3 h-3 rounded bg-amber-600 border border-amber-200/30"></div>
          <div className="w-3 h-3 rounded bg-amber-800 border border-amber-200/30"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

