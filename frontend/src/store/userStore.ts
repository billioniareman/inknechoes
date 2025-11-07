import { create } from 'zustand'
import { authApi, User } from '../api/auth'

interface UserState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const user = await authApi.getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      // Silently handle 401 errors (user not logged in) - this is expected
      if (error.response?.status === 401) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        // Don't log 401 errors - they're expected when user is not logged in
      } else {
        // Only log non-401 errors
        console.error('Error fetching user:', error)
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },
}))

