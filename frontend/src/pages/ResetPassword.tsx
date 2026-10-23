import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useToast } from '../contexts/ToastContext'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      showToast('Invalid reset link. Please request a new one.', 'error')
      navigate('/forgot-password')
    }
  }, [token, navigate, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    if (!token) {
      showToast('Invalid reset token', 'error')
      return
    }

    setLoading(true)
    try {
      await authApi.confirmPasswordReset(token, password)
      setSuccess(true)
      showToast('Password reset successfully!', 'success')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to reset password'
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
        <div className="bg-card border border-border p-6 sm:p-8 rounded-xl shadow-sm text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full mb-1">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-semibold text-foreground">Password Reset Successful!</h2>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-card border border-border p-6 sm:p-8 rounded-xl shadow-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-border">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

