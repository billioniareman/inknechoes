import { useEffect, useRef } from 'react'
import { analyticsApi } from '../api/analytics'

export function useAnalytics(postId: number | undefined) {
    const viewIdRef = useRef<number | null>(null)
    const startTimeRef = useRef<number | null>(null)

    useEffect(() => {
        if (!postId) return

        // Track view on mount
        const trackView = async () => {
            try {
                const data = await analyticsApi.trackView(postId)
                viewIdRef.current = data.id
                startTimeRef.current = Date.now()
            } catch (error) {
                console.error('Failed to track view:', error)
            }
        }

        trackView()

        // Track time on unmount or visibility change
        const updateTime = () => {
            if (viewIdRef.current && startTimeRef.current) {
                const timeSpent = (Date.now() - startTimeRef.current) / 1000
                // Only update if time spent is reasonable (e.g., > 1s and < 24h)
                if (timeSpent > 1 && timeSpent < 86400) {
                    analyticsApi.trackTime(viewIdRef.current, timeSpent).catch(console.error)
                }
            }
        }

        // Handle visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                updateTime()
            } else {
                // Reset start time when tab becomes visible again? 
                // Or just keep accumulating? 
                // For simplicity, let's just update on unmount/hide.
                // A more complex implementation would track active time.
                // Let's reset start time to avoid counting background time if we wanted to be precise,
                // but for now, let's just update the total time spent so far.
                // Actually, if we update time spent, we are overwriting the previous value in DB.
                // So we should just update with the total duration since mount.
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            updateTime()
        }
    }, [postId])
}
