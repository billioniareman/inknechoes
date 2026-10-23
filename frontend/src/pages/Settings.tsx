import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import {
  usersApi,
  UserPreferences,
  UserPreferencesUpdate,
  UserSession,
  AuditLog,
} from '../api/users'
import { useToast } from '../contexts/ToastContext'
import { useUserStore } from '../store/userStore'

type SettingsTab = 'password' | 'preferences' | 'sessions' | 'audit' | 'account'

export default function Settings() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { logout } = useUserStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('password')

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [savingPreferences, setSavingPreferences] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(true)
  const [auditFilter, setAuditFilter] = useState<string>('')

  // Account deletion state
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (activeTab === 'preferences') {
      loadPreferences()
    } else if (activeTab === 'sessions') {
      loadSessions()
    } else if (activeTab === 'audit') {
      loadAuditLogs()
    }
  }, [activeTab])

  const loadPreferences = async () => {
    try {
      setLoadingPreferences(true)
      const data = await usersApi.getMyPreferences()
      setPreferences(data)
    } catch (error) {
      showToast('Failed to load preferences', 'error')
    } finally {
      setLoadingPreferences(false)
    }
  }

  const loadSessions = async () => {
    try {
      setLoadingSessions(true)
      const data = await usersApi.getMySessions(true)
      setSessions(data)
    } catch (error) {
      showToast('Failed to load sessions', 'error')
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true)
      const data = await usersApi.getMyAuditLogs(50, auditFilter || undefined)
      setAuditLogs(data)
    } catch (error) {
      showToast('Failed to load audit logs', 'error')
    } finally {
      setLoadingAuditLogs(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword)
      showToast('Password changed successfully', 'success')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to change password'
      showToast(message, 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!preferences) return

    setSavingPreferences(true)
    try {
      const updateData: UserPreferencesUpdate = {
        email_notifications_enabled: preferences.email_notifications_enabled,
        email_on_new_comment: preferences.email_on_new_comment,
        email_on_new_follower: preferences.email_on_new_follower,
        email_on_post_published: preferences.email_on_post_published,
        email_on_login: preferences.email_on_login,
        profile_visibility: preferences.profile_visibility,
        show_email: preferences.show_email,
        show_analytics: preferences.show_analytics,
        default_content_type: preferences.default_content_type,
        default_visibility: preferences.default_visibility,
        ui_preferences: preferences.ui_preferences,
      }
      await usersApi.updateMyPreferences(updateData)
      showToast('Preferences saved successfully', 'success')
    } catch (error) {
      showToast('Failed to save preferences', 'error')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to revoke this session?')) return

    try {
      await usersApi.revokeSession(sessionId)
      showToast('Session revoked successfully', 'success')
      loadSessions()
    } catch (error) {
      showToast('Failed to revoke session', 'error')
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all sessions? You will be logged out.')) return

    try {
      await usersApi.revokeAllSessions()
      showToast('All sessions revoked. Logging out...', 'success')
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 1000)
    } catch (error) {
      showToast('Failed to revoke sessions', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('Please enter your password to confirm', 'error')
      return
    }

    setDeletingAccount(true)
    try {
      await authApi.deleteAccount(deletePassword)
      showToast('Account deleted successfully', 'success')
      setTimeout(() => {
        logout()
        navigate('/')
      }, 2000)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to delete account'
      showToast(message, 'error')
    } finally {
      setDeletingAccount(false)
      setDeletePassword('')
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      case 'failed':
        return 'bg-destructive/15 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-4 sm:mb-6 md:mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-shrink-0 text-left px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'password'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-shrink-0 text-left px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-shrink-0 text-left px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Active Sessions
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-shrink-0 text-left px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-shrink-0 text-left px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'account'
                  ? 'bg-destructive/15 text-destructive font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Delete Account
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 text-card-foreground">
          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-4 sm:mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 sm:py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-base sm:text-sm shadow-sm"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-4 sm:mb-6">Preferences</h2>
              {loadingPreferences ? (
                <div className="text-center py-8 text-muted-foreground">Loading preferences...</div>
              ) : preferences ? (
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_notifications_enabled}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              email_notifications_enabled: e.target.checked,
                            })
                          }
                          className="mr-3 h-4 w-4 accent-primary rounded"
                        />
                        <span className="text-foreground text-sm">Enable email notifications</span>
                      </label>
                      <label className="flex items-center ml-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_on_new_comment}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              email_on_new_comment: e.target.checked,
                            })
                          }
                          disabled={!preferences.email_notifications_enabled}
                          className="mr-3 h-4 w-4 accent-primary rounded disabled:opacity-50"
                        />
                        <span className="text-foreground text-sm">New comments on my posts</span>
                      </label>
                      <label className="flex items-center ml-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_on_new_follower}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              email_on_new_follower: e.target.checked,
                            })
                          }
                          disabled={!preferences.email_notifications_enabled}
                          className="mr-3 h-4 w-4 accent-primary rounded disabled:opacity-50"
                        />
                        <span className="text-foreground text-sm">New followers</span>
                      </label>
                      <label className="flex items-center ml-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_on_post_published}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              email_on_post_published: e.target.checked,
                            })
                          }
                          disabled={!preferences.email_notifications_enabled}
                          className="mr-3 h-4 w-4 accent-primary rounded disabled:opacity-50"
                        />
                        <span className="text-foreground text-sm">Post published notifications</span>
                      </label>
                      <label className="flex items-center ml-6 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_on_login}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              email_on_login: e.target.checked,
                            })
                          }
                          disabled={!preferences.email_notifications_enabled}
                          className="mr-3 h-4 w-4 accent-primary rounded disabled:opacity-50"
                        />
                        <span className="text-foreground text-sm">Login security alerts</span>
                      </label>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-4">Privacy Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Profile Visibility
                        </label>
                        <select
                          value={preferences.profile_visibility}
                          onChange={(e) =>
                            setPreferences({ ...preferences, profile_visibility: e.target.value })
                          }
                          className="w-full md:w-64 px-3 sm:px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="followers_only">Followers Only</option>
                        </select>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.show_email}
                          onChange={(e) =>
                            setPreferences({ ...preferences, show_email: e.target.checked })
                          }
                          className="mr-3 h-4 w-4 accent-primary rounded"
                        />
                        <span className="text-foreground text-sm">Show email on profile</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.show_analytics}
                          onChange={(e) =>
                            setPreferences({ ...preferences, show_analytics: e.target.checked })
                          }
                          className="mr-3 h-4 w-4 accent-primary rounded"
                        />
                        <span className="text-foreground text-sm">Show analytics on profile</span>
                      </label>
                    </div>
                  </div>

                  {/* Content Defaults */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-4">Content Defaults</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Default Content Type
                        </label>
                        <select
                          value={preferences.default_content_type}
                          onChange={(e) =>
                            setPreferences({ ...preferences, default_content_type: e.target.value })
                          }
                          className="w-full md:w-64 px-3 sm:px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm"
                        >
                          <option value="article">Article</option>
                          <option value="poetry">Poetry</option>
                          <option value="book">Book</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Default Visibility
                        </label>
                        <select
                          value={preferences.default_visibility}
                          onChange={(e) =>
                            setPreferences({ ...preferences, default_visibility: e.target.value })
                          }
                          className="w-full md:w-64 px-3 sm:px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm"
                        >
                          <option value="public">Public</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                      className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm shadow-sm"
                    >
                      {savingPreferences ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Failed to load preferences</div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">Active Sessions</h2>
                <button
                  onClick={handleRevokeAllSessions}
                  className="text-destructive hover:underline text-xs sm:text-sm font-medium"
                >
                  Revoke All Sessions
                </button>
              </div>
              {loadingSessions ? (
                <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active sessions</div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="border border-border rounded-xl p-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-foreground">
                              {session.device_info || 'Unknown Device'}
                            </span>
                            {session.is_active && (
                              <span className="px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          {session.ip_address && (
                            <p className="text-sm text-muted-foreground">IP: {session.ip_address}</p>
                          )}
                          {session.location && (
                            <p className="text-sm text-muted-foreground">Location: {session.location}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Last activity: {formatDate(session.last_activity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(session.created_at)}
                          </p>
                        </div>
                        {session.is_active && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-destructive hover:underline text-sm font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">Audit Logs</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={auditFilter}
                    onChange={(e) => {
                      setAuditFilter(e.target.value)
                      loadAuditLogs()
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="">All Actions</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="password_change">Password Change</option>
                    <option value="email_verified">Email Verified</option>
                    <option value="profile_updated">Profile Updated</option>
                    <option value="account_deleted">Account Deleted</option>
                  </select>
                  <button
                    onClick={loadAuditLogs}
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm sm:text-base font-medium shadow-sm transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {loadingAuditLogs ? (
                <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 border border-border rounded-xl">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                          IP Address
                        </th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-medium text-foreground">
                              {log.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-md font-medium ${getStatusColor(log.status)}`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Delete Account Tab */}
          {activeTab === 'account' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-destructive mb-4 sm:mb-6">Delete Account</h2>
              <div className="max-w-2xl space-y-4 sm:space-y-6">
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-destructive mb-2">Warning</h3>
                  <p className="text-sm sm:text-base text-foreground/90 mb-3 sm:mb-4">
                    Deleting your account is permanent and cannot be undone. This will:
                  </p>
                  <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1 mb-3 sm:mb-4">
                    <li>Delete all your posts and content</li>
                    <li>Delete all your comments</li>
                    <li>Delete all your bookmarks and reading progress</li>
                    <li>Remove your profile and all associated data</li>
                  </ul>
                  <p className="text-sm sm:text-base text-destructive font-medium">
                    Are you absolutely sure you want to proceed?
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full sm:w-auto bg-destructive text-destructive-foreground px-6 py-2.5 sm:py-2 rounded-lg hover:opacity-90 transition text-base sm:text-sm font-medium shadow-sm"
                  >
                    I understand, delete my account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 focus:border-destructive"
                        placeholder="Your password"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={!deletePassword || deletingAccount}
                        className="w-full sm:w-auto bg-destructive text-destructive-foreground px-6 py-2.5 sm:py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition text-base sm:text-sm font-medium shadow-sm"
                      >
                        {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeletePassword('')
                        }}
                        className="w-full sm:w-auto bg-muted text-muted-foreground px-6 py-2.5 sm:py-2 rounded-lg hover:bg-muted/80 hover:text-foreground transition text-base sm:text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

