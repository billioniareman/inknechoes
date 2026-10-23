import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useToast } from '../contexts/ToastContext'

export default function ForgotPassword() {
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      showToast('Please enter your email address', 'error')
      return
    }

    setLoading(true)
    try {
      await authApi.requestPasswordReset(email)
      setSubmitted(true)
      showToast('If email exists, reset link has been sent', 'success')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send reset email'
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-card border border-border p-6 sm:p-8 rounded-xl shadow-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            Forgot Password
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
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
            <h3 className="text-lg font-serif font-semibold text-foreground">Check Your Email</h3>
            <p className="text-sm text-muted-foreground">
              If an account with that email exists, we've sent a password reset link.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                className="text-primary hover:underline font-medium text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

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

