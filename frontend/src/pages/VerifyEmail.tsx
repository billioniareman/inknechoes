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
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-card border border-border p-6 sm:p-8 rounded-xl shadow-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            Email Verification
          </h2>
        </div>

        {status === 'verifying' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-6 space-y-3">
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
            <h3 className="text-lg font-serif font-semibold text-foreground">Email Verified!</h3>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified. Redirecting to login...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-destructive/15 text-destructive rounded-full mb-1">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-serif font-semibold text-destructive">Verification Failed</h3>
              <p className="text-sm text-muted-foreground">
                The verification link is invalid or has expired.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="text-base font-serif font-semibold text-foreground mb-4">
                Resend Verification Email
              </h4>
              <form onSubmit={handleResendVerification} className="space-y-4">
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
                  disabled={resending}
                  className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm"
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
              <p className="text-sm text-muted-foreground mb-4">
                No verification token found. Please check your email for the verification link.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="text-base font-serif font-semibold text-foreground mb-4">
                Resend Verification Email
              </h4>
              <form onSubmit={handleResendVerification} className="space-y-4">
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
                  disabled={resending}
                  className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors shadow-sm"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
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

