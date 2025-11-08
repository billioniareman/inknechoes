import { useState, useEffect, useCallback, useRef } from 'react'
import { dictionaryApi, DictionaryEntry } from '../api/dictionary'

interface UseDictionaryOptions {
  debounceMs?: number
  enabled?: boolean
}

export function useDictionary(options: UseDictionaryOptions = {}) {
  const { debounceMs = 300, enabled = true } = options
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (!enabled) return

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce the selection update
    debounceTimerRef.current = setTimeout(() => {
      const selection = window.getSelection()
      
      if (!selection || selection.rangeCount === 0) {
        setShowPopup(false)
        setSelectedWord(null)
        setDictionaryData(null)
        return
      }

      const selectedText = selection.toString().trim()
      
      if (!selectedText) {
        setShowPopup(false)
        setSelectedWord(null)
        setDictionaryData(null)
        return
      }

      const word = extractWord(selectedText)

      if (word) {
        setSelectedWord(word)
        
        // Get selection position for popup placement
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        // Position popup below the selection, slightly to the right
        setPopupPosition({
          x: rect.right + 10,
          y: rect.bottom + 10,
        })

        // Fetch definition
        fetchDefinition(word)
        setShowPopup(true)
      } else {
        setShowPopup(false)
        setSelectedWord(null)
        setDictionaryData(null)
      }
    }, debounceMs)
  }, [enabled, debounceMs, extractWord, fetchDefinition])

  // Setup selection listeners
  useEffect(() => {
    if (!enabled) return

    // Listen to selection changes
    document.addEventListener('selectionchange', handleTextSelection)
    document.addEventListener('mouseup', handleTextSelection)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      document.removeEventListener('selectionchange', handleTextSelection)
      document.removeEventListener('mouseup', handleTextSelection)
    }
  }, [enabled, handleTextSelection])

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Don't close if clicking inside the popup
      if (!target.closest('[data-dictionary-popup]')) {
        setShowPopup(false)
        setSelectedWord(null)
        setDictionaryData(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPopup])

  const closePopup = useCallback(() => {
    setShowPopup(false)
    setSelectedWord(null)
    setDictionaryData(null)
  }, [])

  return {
    selectedWord,
    dictionaryData,
    popupPosition,
    isLoading,
    showPopup,
    closePopup,
  }
}

