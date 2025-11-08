export interface DictionaryPhonetic {
  text?: string
  audio?: string
}

export interface DictionaryDefinition {
  definition: string
  example?: string
  synonyms: string[]
  antonyms: string[]
}

export interface DictionaryMeaning {
  partOfSpeech: string
  definitions: DictionaryDefinition[]
}

export interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics: DictionaryPhonetic[]
  origin?: string
  meanings: DictionaryMeaning[]
}

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en'

export const dictionaryApi = {
  /**
   * Fetch dictionary definition for a word
   * @param word - The word to look up
   * @returns Promise with dictionary entries or null if not found
   */
  lookupWord: async (word: string): Promise<DictionaryEntry[] | null> => {
    try {
      // Clean the word - remove punctuation and convert to lowercase
      const cleanWord = word.trim().toLowerCase().replace(/[^\w\s-]/g, '')
      
      if (!cleanWord || cleanWord.length === 0) {
        return null
      }

      const response = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(cleanWord)}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null // Word not found
        }
        throw new Error(`Dictionary API error: ${response.status}`)
      }

      const data: DictionaryEntry[] = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching dictionary definition:', error)
      return null
    }
  },
}

