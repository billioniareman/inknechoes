import { EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Toolbar from './Toolbar'
import { useState, useEffect, useCallback } from 'react'
import DictionaryPopup from '../DictionaryPopup'
import { dictionaryApi, DictionaryEntry } from '../../api/dictionary'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  // Collaboration options (only used for book chapters)
  collabId?: number // collaboration record id from backend
  bookId?: number
  chapterId?: number
}


export default function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  collabId,
  bookId,
  chapterId
}: TiptapEditorProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  // Editor instance state (we create the editor imperatively so we can initialize collaboration extensions)
  const [editor, setEditor] = useState<any>(null)

  // Create non-collaborative editor when no collaboration props provided
  useEffect(() => {
    if (bookId && chapterId) return // collaboration will create its own editor

    try {
      const e = new Editor({
        extensions: [
          StarterKit,
          Placeholder.configure({ placeholder }),
        ],
        content,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
          attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
          },
        },
      })

      setEditor(e)
      return () => {
        try { e.destroy() } catch (err) {}
        setEditor(null)
      }
    } catch (err) {
      // If editor fails to initialize (package mismatch, DOM issue, etc.), fall back to a simple textarea
      // so users can still write content. Log error for debugging.
      // eslint-disable-next-line no-console
      console.error('Tiptap editor failed to initialize:', err)
      setEditor(null)
      return () => { setEditor(null) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, placeholder, bookId, chapterId])

  // Collaboration setup (only active when book chapter collaboration props provided)
  useEffect(() => {
    let ydoc: any = null
    let provider: any = null
    let awareness: any = null
    let saveInterval: any = null

    const setupCollab = async () => {
      if (!bookId || !chapterId) return

      try {
        // Dynamic imports to avoid adding required deps unless feature used
        const Y = await import('yjs')
        const { WebsocketProvider } = await import('y-websocket')
        const Collaboration = (await import('@tiptap/extension-collaboration')).default
        const CollaborationCursor = (await import('@tiptap/extension-collaboration-cursor')).default

        // initialize Y.Doc
        ydoc = new Y.Doc()

        const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

        // Fetch snapshot for this book/chapter
        try {
          const q = `?chapter_id=${chapterId}`
          const resp = await fetch(`${baseUrl}/api/v1/collab/books/${bookId}${q}`, {
            credentials: 'include'
          })
          if (resp.ok) {
            const data = await resp.json()
            if (data.snapshot_b64) {
              const bytes = Uint8Array.from(atob(data.snapshot_b64), c => c.charCodeAt(0))
              Y.applyUpdate(ydoc, bytes)
            }
            // If collab exists, but collabId prop is missing, client may request ws token later
          }
        } catch (e) {
          console.error('Failed to fetch snapshot', e)
        }

        // Connect to WS provider
        const wsUrl = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:1234'

        // If collabId not provided, request it by creating/getting the collab entry
        let effectiveCollabId = collabId
        if (!effectiveCollabId && bookId && chapterId) {
          try {
            const data = await (await import('../../api/collaboration')).collaborationApi.createOrGetCollab(bookId, chapterId)
            effectiveCollabId = data.collab_id
          } catch (e) {
            console.error('Failed to create/get collab entry', e)
          }
        }

        // Get WS token from backend (uses cookie auth) for secure WS connection
        let token = ''
        try {
          if (effectiveCollabId) {
            const t = await (await import('../../api/collaboration')).collaborationApi.getWsToken(effectiveCollabId)
            token = t.token
          }
        } catch (e) {
          console.warn('Failed to get WS token, will rely on cookies if available', e)
        }

        provider = new WebsocketProvider(wsUrl, `book-${bookId}-chapter-${chapterId}`, ydoc, { params: { token } })

        // Awareness for cursors
        awareness = provider.awareness
        awareness.setLocalStateField('user', {
          name: (window as any).__USER_NAME__ || 'Anonymous',
          color: (window as any).__USER_COLOR__ || '#f97316'
        })

        // Create a new editor instance with collaboration extensions
        try {
          const collabEditor = new Editor({
            extensions: [
              StarterKit,
              Collaboration.configure({ document: ydoc }),
              CollaborationCursor.configure({
                provider,
                user: {
                  name: (window as any).__USER_NAME__ || 'Anonymous',
                  color: (window as any).__USER_COLOR__ || '#f97316'
                }
              }),
              Placeholder.configure({ placeholder }),
            ],
            content: '', // content will be managed by Yjs
            onUpdate: ({ editor }) => onChange(editor.getHTML()),
            editorProps: {
              attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
              },
            },
          })

          setEditor(collabEditor)
        } catch (err) {
          console.error('Failed to initialize collaborative editor:', err)
          setEditor(null)
        }

        // Autosave snapshot every 5 seconds while connected
        saveInterval = setInterval(async () => {
          try {
            const update = Y.encodeStateAsUpdate(ydoc)
            const b64 = btoa(String.fromCharCode(...Array.from(update as Uint8Array)))
            // prefer collabId from props if available
            const targetCollabId = effectiveCollabId
            if (!targetCollabId) return
            await fetch(`${baseUrl}/api/v1/collab/${targetCollabId}/snapshot`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ snapshot_b64: b64 })
            })
          } catch (e) {
            console.error('Failed to autosave snapshot', e)
          }
        }, 5000)

        // Also persist on Y.Doc updates with debounce to save shortly after activity
        let saveDebounceTimer: any = null
        const onYUpdate = () => {
          if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
          saveDebounceTimer = setTimeout(async () => {
            try {
              const update = Y.encodeStateAsUpdate(ydoc)
              const b64 = btoa(String.fromCharCode(...Array.from(update as Uint8Array)))
              const targetCollabId = effectiveCollabId
              if (!targetCollabId) return
              await fetch(`${baseUrl}/api/v1/collab/${targetCollabId}/snapshot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ snapshot_b64: b64 })
              })
            } catch (e) {
              console.error('Failed to save Y update snapshot', e)
            }
          }, 2000)
        }

        if (ydoc && ydoc.on) ydoc.on('update', onYUpdate)
      } catch (err) {
        console.error('Collaboration setup failed:', err)
      }
    }

    setupCollab()

    return () => {
      try { if (provider) provider.disconnect() } catch (e) {}
      try { if (ydoc && ydoc.off) ydoc.off('update'); } catch (e) {}
      try { if (ydoc) ydoc.destroy() } catch (e) {}
      if (saveInterval) clearInterval(saveInterval)
      try { if (editor) editor.destroy() } catch (e) {}
      setEditor(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId, collabId])

  // Extract word from selected text
  const extractWord = useCallback((text: string): string | null => {
    if (!text) return null
    
    // Remove extra whitespace and get the first word
    const words = text.trim().split(/\s+/)
    if (words.length === 0) return null
    
    // Get the first word and clean it
    const word = words[0].toLowerCase().replace(/[^\w\s-]/g, '')
    
    // Only show dictionary for single words (no spaces, reasonable length)
    if (word.length > 0 && word.length < 50 && !word.includes(' ')) {
      return word
    }
    
    return null
  }, [])

  // Fetch dictionary definition
  const fetchDefinition = useCallback(async (word: string) => {
    if (!word) return
    
    setIsLoading(true)
    setDictionaryData(null)
    
    try {
      const data = await dictionaryApi.lookupWord(word)
      setDictionaryData(data)
    } catch (error) {
      console.error('Error fetching dictionary definition:', error)
      setDictionaryData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle text selection with debouncing
  useEffect(() => {
    if (!editor) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const handleSelectionUpdate = () => {
      // Clear any existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Debounce the selection update to avoid too many API calls
      debounceTimer = setTimeout(() => {
        const { from, to } = editor.state.selection
        
        // Only show dictionary if there's a selection
        if (from === to) {
          setShowPopup(false)
          setSelectedWord(null)
          setDictionaryData(null)
          return
        }

        const selectedText = editor.state.doc.textBetween(from, to)
        const word = extractWord(selectedText)

        if (word) {
          setSelectedWord(word)
          
          // Get selection position for popup placement
          const { view } = editor
          const end = view.coordsAtPos(to)
          
          // Position popup below the selection, slightly to the right
          // Use window coordinates for fixed positioning
          setPopupPosition({
            x: end.right + 10,
            y: end.bottom + 10,
          })

          // Fetch definition
          fetchDefinition(word)
          setShowPopup(true)
        } else {
          setShowPopup(false)
          setSelectedWord(null)
          setDictionaryData(null)
        }
      }, 300) // 300ms debounce delay
    }

    // Listen to selection changes
    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('update', handleSelectionUpdate)

    // Also listen to mouseup for immediate feedback
    const editorElement = editor.view.dom
    const handleMouseUp = () => {
      // Small delay to ensure selection is updated
      setTimeout(() => {
        handleSelectionUpdate()
      }, 10)
    }

    editorElement.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      editor.off('selectionUpdate', handleSelectionUpdate)
      editor.off('update', handleSelectionUpdate)
      editorElement.removeEventListener('mouseup', handleMouseUp)
    }
  }, [editor, extractWord, fetchDefinition])

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Don't close if clicking inside the editor or popup
      if (
        !target.closest('.border') &&
        !target.closest('[data-dictionary-popup]')
      ) {
        setShowPopup(false)
        setSelectedWord(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopup])

  if (!editor) {
    // Fallback UI when tiptap editor cannot initialize — show a textarea so user can still type
    return (
      <div className="relative border border-border rounded-lg">
        <div className="p-2 border-b border-border">
          <div className="text-sm text-gray-600">Simple editor (fallback)</div>
        </div>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-4 resize-vertical focus:outline-none"
        />
      </div>
    )
  }

  return (
    <div className="relative border border-border rounded-lg">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      
      {showPopup && selectedWord && (
        <div data-dictionary-popup>
          <DictionaryPopup
            word={selectedWord}
            definition={dictionaryData}
            position={popupPosition}
            onClose={() => {
              setShowPopup(false)
              setSelectedWord(null)
              setDictionaryData(null)
            }}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}

