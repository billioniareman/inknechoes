import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useToast } from '../contexts/ToastContext'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setStatus('verifying')
    try {
      await authApi.verifyEmail(verificationToken)
      setStatus('success')
      showToast('Email verified successfully!', 'success')
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      const message = error.response?.data?.detail || 'Invalid or expired verification token'
      showToast(message, 'error')
    }
  }

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      showToast('Please enter your email address', 'error')
      return
    }

    setResending(true)
    try {
      await authApi.resendVerification(email)
      showToast('Verification email sent! Please check your inbox.', 'success')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to resend verification email'
      showToast(message, 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-serif font-bold text-amber-900 mb-2">
            Email Verification
          </h2>
        </div>

        {status === 'verifying' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-amber-700">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
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
            <h3 className="text-xl font-semibold text-green-800 mb-2">Email Verified!</h3>
            <p className="text-green-700 mb-4">
              Your email has been successfully verified. Redirecting to login...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="inline-block bg-red-100 rounded-full p-3 mb-4">
                <svg
                  className="h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Verification Failed</h3>
              <p className="text-red-700 mb-4">
                The verification link is invalid or has expired.
              </p>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-amber-900 mb-4">
                Resend Verification Email
              </h4>
              <form onSubmit={handleResendVerification} className="space-y-4">
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
                  disabled={resending}
                  className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
            </div>
          </div>
        )}

        {status === 'idle' && !token && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-gray-700 mb-4">
                No verification token found. Please check your email for the verification link.
              </p>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-amber-900 mb-4">
                Resend Verification Email
              </h4>
              <form onSubmit={handleResendVerification} className="space-y-4">
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
                  disabled={resending}
                  className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
            </div>
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

