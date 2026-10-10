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
      case 0: return 'bg-secondary/40'
      case 1: return 'bg-literary/25'
      case 2: return 'bg-literary/50'
      case 3: return 'bg-literary/75'
      case 4: return 'bg-literary text-white'
      default: return 'bg-secondary/40'
    }
  }

  // Group by weeks (52 weeks)
  const weeks: Array<Array<{ date: string; count: number; level: number }>> = []
  for (let i = 0; i < 52; i++) {
    const weekStart = i * 7
    weeks.push(heatmapData.slice(weekStart, weekStart + 7))
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm mb-6 transition-colors">
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">Writing Activity Heatmap</h3>
      <div className="flex gap-1 overflow-x-auto pb-4">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={`w-3 h-3 rounded-sm ${getColor(day.level)} border border-border/40 transition-colors`}
                title={`${day.date}: ${day.count} publication${day.count === 1 ? '' : 's'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground font-sans">
        <span>Less activity</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-secondary/40 border border-border/40" />
          <div className="w-3 h-3 rounded-sm bg-literary/25 border border-border/40" />
          <div className="w-3 h-3 rounded-sm bg-literary/50 border border-border/40" />
          <div className="w-3 h-3 rounded-sm bg-literary/75 border border-border/40" />
          <div className="w-3 h-3 rounded-sm bg-literary border border-border/40" />
        </div>
        <span>More activity</span>
      </div>
    </div>
  )
}

