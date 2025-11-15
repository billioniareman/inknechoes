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
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold text-amber-900 mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === 'password'
                  ? 'bg-amber-100 text-amber-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-amber-100 text-amber-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === 'sessions'
                  ? 'bg-amber-100 text-amber-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Active Sessions
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === 'audit'
                  ? 'bg-amber-100 text-amber-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === 'account'
                  ? 'bg-red-100 text-red-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Delete Account
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Preferences</h2>
              {loadingPreferences ? (
                <div className="text-center py-8">Loading preferences...</div>
              ) : preferences ? (
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.email_notifications_enabled}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              email_notifications_enabled: e.target.checked,
                            })
                          }
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">Enable email notifications</span>
                      </label>
                      <label className="flex items-center ml-6">
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
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="text-gray-700">New comments on my posts</span>
                      </label>
                      <label className="flex items-center ml-6">
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
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="text-gray-700">New followers</span>
                      </label>
                      <label className="flex items-center ml-6">
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
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="text-gray-700">Post published notifications</span>
                      </label>
                      <label className="flex items-center ml-6">
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
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="text-gray-700">Login security alerts</span>
                      </label>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profile Visibility
                        </label>
                        <select
                          value={preferences.profile_visibility}
                          onChange={(e) =>
                            setPreferences({ ...preferences, profile_visibility: e.target.value })
                          }
                          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="followers_only">Followers Only</option>
                        </select>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.show_email}
                          onChange={(e) =>
                            setPreferences({ ...preferences, show_email: e.target.checked })
                          }
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">Show email on profile</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.show_analytics}
                          onChange={(e) =>
                            setPreferences({ ...preferences, show_analytics: e.target.checked })
                          }
                          className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">Show analytics on profile</span>
                      </label>
                    </div>
                  </div>

                  {/* Content Defaults */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Defaults</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Content Type
                        </label>
                        <select
                          value={preferences.default_content_type}
                          onChange={(e) =>
                            setPreferences({ ...preferences, default_content_type: e.target.value })
                          }
                          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="article">Article</option>
                          <option value="poetry">Poetry</option>
                          <option value="book">Book</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Visibility
                        </label>
                        <select
                          value={preferences.default_visibility}
                          onChange={(e) =>
                            setPreferences({ ...preferences, default_visibility: e.target.value })
                          }
                          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="public">Public</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPreferences}
                    className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingPreferences ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Failed to load preferences</div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-amber-900">Active Sessions</h2>
                <button
                  onClick={handleRevokeAllSessions}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Revoke All Sessions
                </button>
              </div>
              {loadingSessions ? (
                <div className="text-center py-8">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No active sessions</div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {session.device_info || 'Unknown Device'}
                            </span>
                            {session.is_active && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          {session.ip_address && (
                            <p className="text-sm text-gray-600">IP: {session.ip_address}</p>
                          )}
                          {session.location && (
                            <p className="text-sm text-gray-600">Location: {session.location}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Last activity: {formatDate(session.last_activity)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {formatDate(session.created_at)}
                          </p>
                        </div>
                        {session.is_active && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-amber-900">Audit Logs</h2>
                <div className="flex gap-2">
                  <select
                    value={auditFilter}
                    onChange={(e) => {
                      setAuditFilter(e.target.value)
                      loadAuditLogs()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
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
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {loadingAuditLogs ? (
                <div className="text-center py-8">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No audit logs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {log.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded ${getStatusColor(log.status)}`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
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
              <h2 className="text-2xl font-semibold text-red-900 mb-6">Delete Account</h2>
              <div className="max-w-2xl space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Warning</h3>
                  <p className="text-red-800 mb-4">
                    Deleting your account is permanent and cannot be undone. This will:
                  </p>
                  <ul className="list-disc list-inside text-red-800 space-y-1 mb-4">
                    <li>Delete all your posts and content</li>
                    <li>Delete all your comments</li>
                    <li>Delete all your bookmarks and reading progress</li>
                    <li>Remove your profile and all associated data</li>
                  </ul>
                  <p className="text-red-800 font-medium">
                    Are you absolutely sure you want to proceed?
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    I understand, delete my account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                        placeholder="Your password"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={!deletePassword || deletingAccount}
                        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeletePassword('')
                        }}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
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

