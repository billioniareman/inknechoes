import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { postsApi, PostCreate, PostUpdate, PostWithContent } from '../api/posts'
import { chaptersApi, ChapterCreate, Chapter } from '../api/chapters'
import TiptapEditor from '../components/Editor/TiptapEditor'
import { useToast } from '../contexts/ToastContext'
import { Plus, X, GripVertical, Save, CheckCircle } from 'lucide-react'

interface Chapter {
  id?: number
  title: string
  order: number
  content: string
}

export default function Write() {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId?: string }>()
  const { success, error: showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [currentPostId, setCurrentPostId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [contentType, setContentType] = useState('article')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load existing post if editing
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return

      setLoading(true)
      try {
        const post = await postsApi.getPost(Number(postId))
        setIsEditing(true)
        setCurrentPostId(post.id)
        setTitle(post.title)
        setSlug(post.slug)
        setVisibility(post.visibility)
        setContentType(post.content_type)
        setTags(post.content.tags.join(', '))
        setDescription(post.content.description || '')
        setCoverImageUrl(post.content.cover_image_url || '')
        setContent(post.content.body)

        // Load chapters if it's a book
        if (post.content_type === 'book') {
          try {
            const chaptersData = await chaptersApi.getChapters(post.id)
            const chaptersWithContent: Chapter[] = []
            
            for (const chapter of chaptersData) {
              const chapterWithContent = await chaptersApi.getChapter(chapter.id)
              chaptersWithContent.push({
                id: chapter.id,
                title: chapter.title,
                order: chapter.order,
                content: chapterWithContent.content.body
              })
            }
            
            setChapters(chaptersWithContent)
            if (chaptersWithContent.length > 0) {
              setActiveChapterIndex(0)
            }
          } catch (error) {
            console.error('Failed to load chapters:', error)
          }
        }
      } catch (error) {
        console.error('Failed to load post:', error)
        alert('Failed to load post. Redirecting to new post.')
        navigate('/write')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [postId, navigate])

  // Auto-generate slug from title (only if not editing or slug is empty)
  useEffect(() => {
    if (!isEditing || !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug)
    }
  }, [title, isEditing, slug])

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!title || (contentType !== 'book' && !content) || (contentType === 'book' && chapters.length === 0)) {
      setAutoSaveStatus('idle')
      return
    }

    const autoSaveTimer = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving')
        
        if (isEditing && currentPostId) {
          // Update existing draft
          const updateData: PostUpdate = {
            title,
            slug: slug || 'untitled',
            visibility: 'draft', // Auto-save as draft
            content_type: contentType,
            content: {
              body: contentType === 'book' ? '' : content,
              tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
              cover_image_url: coverImageUrl || undefined,
              description: description || undefined,
            },
          }
          await postsApi.updatePost(currentPostId, updateData)
        } else {
          // Create new draft
          const postData: PostCreate = {
            title,
            slug: slug || 'untitled',
            visibility: 'draft',
            content_type: contentType,
            content: {
              body: contentType === 'book' ? '' : content,
              tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
              cover_image_url: coverImageUrl || undefined,
              description: description || undefined,
            },
          }
          const post = await postsApi.createPost(postData)
          setCurrentPostId(post.id)
          setIsEditing(true)
          // Update URL to include post ID
          navigate(`/write/${post.id}`, { replace: true })
        }
        
        setAutoSaveStatus('saved')
        setLastSaved(new Date())
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 2000)
      } catch (error) {
        console.error('Auto-save error:', error)
        setAutoSaveStatus('error')
        setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 3000)
      }
    }, 10000)

    return () => clearTimeout(autoSaveTimer)
  }, [title, slug, content, tags, contentType, chapters, coverImageUrl, description, isEditing, currentPostId, navigate])

  const addChapter = () => {
    const newChapter: Chapter = {
      title: `Chapter ${chapters.length + 1}`,
      order: chapters.length + 1,
      content: ''
    }
    setChapters([...chapters, newChapter])
    setActiveChapterIndex(chapters.length)
    // Clear the active chapter content when adding a new chapter
    // The new chapter will have empty content by default
  }

  const removeChapter = (index: number) => {
    const updated = chapters.filter((_, i) => i !== index).map((ch, i) => ({
      ...ch,
      order: i + 1
    }))
    setChapters(updated)
    if (activeChapterIndex === index) {
      setActiveChapterIndex(null)
    } else if (activeChapterIndex !== null && activeChapterIndex > index) {
      setActiveChapterIndex(activeChapterIndex - 1)
    }
  }

  const updateChapter = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...chapters]
    updated[index] = { ...updated[index], [field]: value }
    setChapters(updated)
  }

  const handleSave = async () => {
    if (!title) {
      alert('Please fill in title')
      return
    }

    if (contentType === 'book' && chapters.length === 0) {
      alert('Please add at least one chapter for a book')
      return
    }

    if (contentType !== 'book' && !content) {
      alert('Please fill in content')
      return
    }

    setPublishing(true)
    try {
      if (isEditing && currentPostId) {
        // Update existing post
        const updateData: PostUpdate = {
          title,
          slug: slug || 'untitled',
          visibility,
          content: {
            body: contentType === 'book' ? '' : content,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            cover_image_url: coverImageUrl || undefined,
            description: description || undefined,
          },
        }
        const post = await postsApi.updatePost(currentPostId, updateData)

        // Update chapters if it's a book
        if (contentType === 'book') {
          // Get existing chapters
          const existingChapters = await chaptersApi.getChapters(post.id)
          
          // Delete chapters that are no longer in the list
          for (const existingChapter of existingChapters) {
            const stillExists = chapters.some(ch => ch.id === existingChapter.id)
            if (!stillExists) {
              await chaptersApi.deleteChapter(existingChapter.id)
            }
          }

          // Update or create chapters
          for (const chapter of chapters) {
            if (chapter.id) {
              // Update existing chapter
              await chaptersApi.updateChapter(chapter.id, {
                title: chapter.title,
                order: chapter.order,
                content: {
                  body: chapter.content
                }
              })
            } else {
              // Create new chapter
              await chaptersApi.createChapter(post.id, {
                title: chapter.title,
                order: chapter.order,
                content: {
                  body: chapter.content
                }
              })
            }
          }
        }

        if (visibility === 'public') {
          navigate(`/post/${post.slug}`)
        } else {
          alert('Draft saved successfully!')
        }
      } else {
        // Create new post
        const postData: PostCreate = {
          title,
          slug: slug || 'untitled',
          visibility,
          content_type: contentType,
          content: {
            body: contentType === 'book' ? '' : content,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            cover_image_url: coverImageUrl || undefined,
            description: description || undefined,
          },
        }
        const post = await postsApi.createPost(postData)
        setCurrentPostId(post.id)
        setIsEditing(true)

        // If it's a book, create chapters
        if (contentType === 'book' && chapters.length > 0) {
          for (const chapter of chapters) {
            await chaptersApi.createChapter(post.id, {
              title: chapter.title,
              order: chapter.order,
              content: {
                body: chapter.content
              }
            })
          }
        }

        if (visibility === 'public') {
          success('Post published successfully!')
          navigate(`/post/${post.slug}`)
        } else {
          success('Draft saved successfully!')
          // Update URL to include post ID for future edits
          navigate(`/write/${post.id}`, { replace: true })
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || `Failed to ${visibility === 'public' ? 'publish' : 'save draft'}`
      showError(errorMessage)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-16">
          <p className="text-amber-800">Loading...</p>
        </div>
      </div>
    )
  }

  const buttonText = visibility === 'public' ? 'Publish' : 'Save as Draft'

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-serif font-bold text-amber-900">
          {isEditing ? 'Edit Post' : 'Write a New Post'}
        </h1>
        {/* Auto-save Indicator */}
        {autoSaveStatus !== 'idle' && (
          <div className="flex items-center gap-2 text-sm text-amber-800/70">
            {autoSaveStatus === 'saving' && (
              <>
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Saved</span>
                {lastSaved && (
                  <span className="text-xs">
                    {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <X className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Save failed</span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-serif font-semibold text-amber-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-amber-800">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-md bg-white"
                placeholder="Enter post title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-amber-800">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-md bg-white"
                placeholder="url-friendly-slug"
              />
            </div>
            {contentType === 'book' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-amber-800">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-amber-200 rounded-md bg-white min-h-[100px]"
                    placeholder="Book description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-amber-800">Cover Image URL</label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full p-2 border border-amber-200 rounded-md bg-white"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-amber-800">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 border border-amber-200 rounded-md bg-white"
                placeholder="fiction, poetry, sci-fi"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-amber-800">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value)
                    if (e.target.value !== 'book') {
                      setChapters([])
                      setActiveChapterIndex(null)
                    }
                  }}
                  className="w-full p-2 border border-amber-200 rounded-md bg-white"
                >
                  <option value="article">Article</option>
                  <option value="poetry">Poetry</option>
                  <option value="book">Book (Long Form)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-amber-800">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full p-2 border border-amber-200 rounded-md bg-white"
                >
                  <option value="public">Public</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        {contentType === 'book' ? (
          <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-semibold text-amber-900">Chapters</h2>
              <button
                onClick={addChapter}
                className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-amber-50 rounded-md hover:bg-amber-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Chapter
              </button>
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-12 text-amber-700">
                <p className="mb-4">No chapters yet. Click "Add Chapter" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Chapter List */}
                <div className="space-y-2 mb-6">
                  {chapters.map((chapter, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        activeChapterIndex === index
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-amber-200 bg-white hover:bg-amber-50/50'
                      }`}
                      onClick={() => setActiveChapterIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-amber-600" />
                          <span className="font-semibold text-amber-900">
                            Chapter {chapter.order}: {chapter.title || 'Untitled'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeChapter(index)
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Chapter Editor */}
                {activeChapterIndex !== null && (
                  <div className="border border-amber-200 rounded-lg p-6 bg-white">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-amber-800">Chapter Title</label>
                      <input
                        type="text"
                        value={chapters[activeChapterIndex].title}
                        onChange={(e) => updateChapter(activeChapterIndex, 'title', e.target.value)}
                        className="w-full p-2 border border-amber-200 rounded-md"
                        placeholder="Chapter title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-amber-800">Chapter Content</label>
                      <TiptapEditor
                        key={`chapter-${activeChapterIndex}-${chapters[activeChapterIndex].order}`}
                        content={chapters[activeChapterIndex].content}
                        onChange={(content) => updateChapter(activeChapterIndex, 'content', content)}
                        placeholder="Write your chapter content..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/60 border border-amber-200/50 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-serif font-semibold text-amber-900 mb-4">Content</h2>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        )}

        {/* Save/Publish Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSave}
            disabled={publishing || !title || (contentType !== 'book' && !content) || (contentType === 'book' && chapters.length === 0)}
            className="px-6 py-3 bg-amber-800 text-amber-50 rounded-md hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {publishing 
              ? (visibility === 'public' ? 'Publishing...' : 'Saving...') 
              : buttonText
            }
          </button>
        </div>
      </div>
    </div>
  )
}

