import { useEffect, useState } from 'react'
import { collaborationApi } from '../../api/collaboration'
import { useUserStore } from '../../store/userStore'

export default function CollaboratorsBar({ collabId, bookId, chapterId, ownerId }: { collabId?: number, bookId?: number, chapterId?: number, ownerId?: number }) {
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [loading, setLoading] = useState(false)
  const [currentCollabId, setCurrentCollabId] = useState<number | undefined>(collabId)
  const currentUser = useUserStore(state => state.user)
  const canInvite = !!(currentUser && ownerId && currentUser.id === ownerId)

  // Deterministic color palette for collaborators (used when server doesn't supply a color)
  const COLOR_PALETTE = ['#f97316', '#ef4444', '#06b6d4', '#a78bfa', '#f59e0b', '#10b981', '#ef9a9a', '#f48fb1']
  const hashToIndex = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h) % COLOR_PALETTE.length
  }
  const pickColor = (c: any) => {
    if (c && c.color) return c.color
    const key = String(c?.user_id ?? c?.display_name ?? Math.random())
    return COLOR_PALETTE[hashToIndex(key)]
  }

  // Keep local collab id in sync with prop
  useEffect(() => {
    setCurrentCollabId(collabId)
  }, [collabId])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        let effectiveCollabId = currentCollabId
        // If we don't have a collabId but we have book+chapter, try to create or get one only when current user is owner
        if (!effectiveCollabId && bookId && chapterId) {
          if (canInvite) {
            console.debug('Creating/getting collab for book', bookId, 'chapter', chapterId)
            const data = await collaborationApi.createOrGetCollab(bookId, chapterId)
            effectiveCollabId = data.collab_id
            setCurrentCollabId(effectiveCollabId)
          } else {
            // If user is not owner, try to fetch existing collab if any
            try {
              const data = await collaborationApi.getCollabByBook(bookId, chapterId)
              effectiveCollabId = data.collab_id
              setCurrentCollabId(effectiveCollabId)
            } catch (err) {
              // ignore - collab may not exist yet and non-owner cannot create it
              console.debug('No collab found for book/chapter (and current user not owner)')
            }
          }
        }
        if (!effectiveCollabId) return
        const res = await collaborationApi.listCollaborators(effectiveCollabId)
        if (!mounted) return
        setCollaborators(res.collaborators)
      } catch (e) {
        console.error('Failed to list collaborators', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [collabId, bookId, chapterId, currentCollabId, canInvite, ownerId])

  const invite = async () => {
    if (!inviteUserId) {
      alert('Enter a user id to invite')
      return
    }

    if (isNaN(Number(inviteUserId))) {
      alert('Enter a valid numeric user id')
      return
    }

    if (!canInvite) {
      alert('Only the book owner can invite collaborators')
      return
    }

    setLoading(true)
    try {
      let effectiveCollabId = currentCollabId
      if (!effectiveCollabId) {
        if (!bookId || !chapterId) {
          alert('Unable to invite: missing book or chapter information')
          setLoading(false)
          return
        }
        // create collab entry (owner only)
        const data = await collaborationApi.createOrGetCollab(bookId, chapterId)
        effectiveCollabId = data.collab_id
        setCurrentCollabId(effectiveCollabId)
      }

      console.debug('Inviting user', inviteUserId, 'to collab', effectiveCollabId)
      await collaborationApi.inviteCollaborator(effectiveCollabId!, { user_id: Number(inviteUserId), role: inviteRole })
      setShowInvite(false)
      // refresh list
      const res = await collaborationApi.listCollaborators(effectiveCollabId!)
      setCollaborators(res.collaborators)
      setInviteUserId('')
    } catch (e) {
      console.error('Invite failed', e)
      alert('Invite failed. See console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {collaborators.slice(0, 5).map((c) => (
          <div key={c.user_id || c.display_name} title={`${c.display_name || c.user_id} (${c.role})`} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border border-white" style={{ backgroundColor: pickColor(c) }}>
            {c.display_name ? c.display_name.charAt(0).toUpperCase() : String(c.user_id)}
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          // Only show invite dialog when allowed
          if (!currentCollabId && !(bookId && chapterId && canInvite)) return
          setShowInvite(true)
        }}
        className="px-3 py-1 bg-amber-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!(currentCollabId || (bookId && chapterId && canInvite))}
        title={!currentCollabId && bookId && chapterId && !canInvite ? 'Only book owner can invite collaborators' : (!currentCollabId && !(bookId && chapterId) ? 'Save the post/chapter to enable sharing' : '')}
      >
        Share
      </button>

      {showInvite && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-4 rounded shadow max-w-sm w-full">
            <h3 className="font-semibold mb-2">Invite collaborator</h3>
            <label className="block text-sm text-gray-700">User ID</label>
            <input value={inviteUserId} onChange={e => setInviteUserId(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="User ID (numeric, e.g. 123)" />
            <label className="block text-sm text-gray-700">Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full p-2 border rounded mb-4">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowInvite(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={invite} className="px-3 py-1 bg-amber-800 text-white rounded" disabled={loading}>{loading ? 'Inviting...' : 'Invite'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}