import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../api/auth'
import { useUserStore } from '../store/userStore'
import { useToast } from '../contexts/ToastContext'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bio: z.string().optional(),
  genre_tags: z.string().optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  const { success, error: showError } = useToast()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('')
      // Register new user
      await authApi.register(data)
      
      // Auto-login after registration
      await authApi.login({ email: data.email, password: data.password })
      
      // Wait for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Fetch user data to update store
      const user = await authApi.getCurrentUser()
      setUser(user)
      
      success('Account created successfully! Welcome to Ink&Echoes!')
      
      // Redirect to home page
      navigate('/', { replace: true })
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Registration failed. Please try again.'
      setError(errorMessage)
      showError(errorMessage)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-4xl font-serif font-bold mb-6 text-center">Create Your Account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full p-2 border border-border rounded-md"
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            {...register('username')}
            className="w-full p-2 border border-border rounded-md"
          />
          {errors.username && (
            <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full p-2 border border-border rounded-md"
          />
          {errors.password && (
            <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio (optional)</label>
          <textarea
            {...register('bio')}
            className="w-full p-2 border border-border rounded-md"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Genre Tags (optional)</label>
          <input
            type="text"
            {...register('genre_tags')}
            placeholder="e.g., fiction, poetry, sci-fi"
            className="w-full p-2 border border-border rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 font-medium"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}

