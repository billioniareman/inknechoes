import { useEditor, EditorContent } from '@tiptap/react'
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
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: TiptapEditorProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  })

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
    return null
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

