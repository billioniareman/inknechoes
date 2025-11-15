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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-serif font-bold text-amber-900 mb-2">
            Forgot Password
          </h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="inline-block bg-green-100 rounded-full p-3 mb-4">
              <svg
                className="h-12 w-12 text-green-600"
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
            <h3 className="text-xl font-semibold text-green-800 mb-2">Check Your Email</h3>
            <p className="text-green-700 mb-4">
              If an account with that email exists, we've sent a password reset link.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => {
                setSubmitted(false)
                setEmail('')
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        <div className="text-center pt-4 border-t">
          <Link
            to="/login"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

