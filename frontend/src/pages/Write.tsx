import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { postsApi, PostCreate, PostUpdate } from '../api/posts'
import { chaptersApi } from '../api/chapters'
import TiptapEditor from '../components/Editor/TiptapEditor'
import CollaboratorsBar from '../components/Collaborators/CollaboratorsBar'
import PublishModal from '../components/PublishModal'
import { useToast } from '../contexts/ToastContext'
import {
  Feather,
  Plus,
  Trash2,
  CheckCircle,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  BookOpen,
  Sparkles,
  FileText,
  ArrowLeft,
  Cloud
} from 'lucide-react'

interface Chapter {
  id?: number
  title: string
  order: number
  content: string
}

export default function Write() {
  const navigate = useNavigate()
  const { postId } = useParams<{ postId?: string }>()
  const { showToast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [currentPostId, setCurrentPostId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [visibility, setVisibility] = useState('draft')
  const [contentType, setContentType] = useState('story')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null)
  const [authorId, setAuthorId] = useState<number | null>(null)

  // Studio UX states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Parse type from URL query if creating new
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const typeParam = searchParams.get('type')
    if (typeParam && !postId) {
      if (typeParam === 'poem') setContentType('poem')
      else if (typeParam === 'book') {
        setContentType('book')
        if (chapters.length === 0) {
          setChapters([{ title: 'Chapter 1: The Beginning', order: 1, content: '' }])
          setActiveChapterIndex(0)
        }
      } else if (typeParam === 'journal') setContentType('journal')
      else if (typeParam === 'story') setContentType('story')
    }
  }, [postId])

  // Load existing post if editing
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return
      setLoading(true)
      try {
        const post = await postsApi.getPost(Number(postId))
        setIsEditing(true)
        setCurrentPostId(post.id)
        setAuthorId(post.author_id ?? null)
        setTitle(post.title)
        setSlug(post.slug)
        setVisibility(post.visibility)
        setContentType(post.content_type)
        setTags(post.content.tags ? post.content.tags.join(', ') : '')
        setDescription(post.content.description || '')
        setCoverImageUrl(post.content.cover_image_url || '')
        setContent(post.content.body || '')

        // Load chapters if book
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
                content: chapterWithContent.content?.body || '',
              })
            }
            setChapters(chaptersWithContent)
            if (chaptersWithContent.length > 0) {
              setActiveChapterIndex(0)
            }
          } catch (e) {
            console.error('Failed to load book chapters:', e)
          }
        }
      } catch (err) {
        console.error('Failed to load post:', err)
        showToast('Failed to load manuscript. Starting new document.', 'error')
        navigate('/write')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [postId, navigate])

  // Word count & reading time calculation
  const stats = useMemo(() => {
    const text = contentType === 'book' && activeChapterIndex !== null && chapters[activeChapterIndex]
      ? chapters[activeChapterIndex].content
      : content
    const words = text ? text.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter(Boolean).length : 0
    const chars = text ? text.replace(/<[^>]*>?/gm, '').length : 0
    const readingTime = Math.max(1, Math.ceil(words / 200))
    return { words, chars, readingTime }
  }, [content, chapters, activeChapterIndex, contentType])

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing || !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(generatedSlug || 'untitled')
    }
  }, [title, isEditing, slug])

  // Reliable debounced autosave
  useEffect(() => {
    if (!title.trim()) {
      setAutoSaveStatus('idle')
      return
    }

    const timer = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving')
        if (isEditing && currentPostId) {
          const updateData: PostUpdate = {
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
          await postsApi.updatePost(currentPostId, updateData)

          // Auto-save active chapter if book
          if (contentType === 'book' && activeChapterIndex !== null && chapters[activeChapterIndex]) {
            const ch = chapters[activeChapterIndex]
            if (ch.id) {
              await chaptersApi.updateChapter(ch.id, {
                title: ch.title,
                order: ch.order,
                content: { body: ch.content },
              })
            }
          }
        } else {
          // Create draft
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
          navigate(`/write/${post.id}`, { replace: true })
        }

        setAutoSaveStatus('saved')
        setLastSaved(new Date())
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } catch (err) {
        console.error('Auto-save error:', err)
        setAutoSaveStatus('error')
        setTimeout(() => setAutoSaveStatus('idle'), 4000)
      }
    }, 12000)

    return () => clearTimeout(timer)
  }, [title, content, tags, chapters, activeChapterIndex, contentType, isEditing, currentPostId, coverImageUrl, description])

  const addChapter = () => {
    const newChapter: Chapter = {
      title: `Chapter ${chapters.length + 1}`,
      order: chapters.length + 1,
      content: '',
    }
    setChapters([...chapters, newChapter])
    setActiveChapterIndex(chapters.length)
  }

  const removeChapter = async (index: number) => {
    const chapter = chapters[index]
    if (chapter.id) {
      try {
        await chaptersApi.deleteChapter(chapter.id)
      } catch (e) {
        console.error('Failed to delete chapter:', e)
      }
    }
    const updated = chapters.filter((_, i) => i !== index).map((ch, i) => ({
      ...ch,
      order: i + 1,
    }))
    setChapters(updated)
    if (activeChapterIndex === index) {
      setActiveChapterIndex(updated.length > 0 ? 0 : null)
    } else if (activeChapterIndex !== null && activeChapterIndex > index) {
      setActiveChapterIndex(activeChapterIndex - 1)
    }
  }

  const updateChapterTitle = (index: number, newTitle: string) => {
    const updated = [...chapters]
    updated[index] = { ...updated[index], title: newTitle }
    setChapters(updated)
  }

  const handleEditorContentChange = (newHtml: string) => {
    if (contentType === 'book' && activeChapterIndex !== null) {
      const updated = [...chapters]
      updated[activeChapterIndex] = { ...updated[activeChapterIndex], content: newHtml }
      setChapters(updated)
    } else {
      setContent(newHtml)
    }
  }

  // Publication handler called from 5-step PublishModal
  const handlePublishSubmit = async (metadata: {
    visibility: 'public' | 'draft'
    coverImageUrl?: string
    description?: string
    genre?: string
    tags: string
    language: string
  }) => {
    if (!title.trim()) {
      showToast('Please provide a manuscript title', 'error')
      return
    }

    try {
      const tagsArray = metadata.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (metadata.genre && !tagsArray.includes(metadata.genre.toLowerCase())) {
        tagsArray.push(metadata.genre.toLowerCase())
      }

      let publishedPost

      if (isEditing && currentPostId) {
        const updateData: PostUpdate = {
          title,
          slug: slug || 'untitled',
          visibility: metadata.visibility,
          content_type: contentType,
          content: {
            body: contentType === 'book' ? '' : content,
            tags: tagsArray,
            cover_image_url: metadata.coverImageUrl,
            description: metadata.description,
          },
        }
        publishedPost = await postsApi.updatePost(currentPostId, updateData)

        // Sync all chapters for book
        if (contentType === 'book') {
          for (const ch of chapters) {
            if (ch.id) {
              await chaptersApi.updateChapter(ch.id, {
                title: ch.title,
                order: ch.order,
                content: { body: ch.content },
              })
            } else {
              await chaptersApi.createChapter(publishedPost.id, {
                title: ch.title,
                order: ch.order,
                content: { body: ch.content },
              })
            }
          }
        }
      } else {
        const postData: PostCreate = {
          title,
          slug: slug || 'untitled',
          visibility: metadata.visibility,
          content_type: contentType,
          content: {
            body: contentType === 'book' ? '' : content,
            tags: tagsArray,
            cover_image_url: metadata.coverImageUrl,
            description: metadata.description,
          },
        }
        publishedPost = await postsApi.createPost(postData)
        if (contentType === 'book') {
          for (const ch of chapters) {
            await chaptersApi.createChapter(publishedPost.id, {
              title: ch.title,
              order: ch.order,
              content: { body: ch.content },
            })
          }
        }
      }

      showToast(
        metadata.visibility === 'public'
          ? 'Manuscript published to Ink&Echoes!'
          : 'Draft saved to your library',
        'success'
      )

      if (metadata.visibility === 'public') {
        navigate(`/post/${publishedPost.slug}`)
      }
    } catch (err: any) {
      console.error('Publish error:', err)
      showToast('Failed to publish. Please check required fields.', 'error')
      throw err
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-serif">
        <Feather className="w-6 h-6 animate-pulse text-literary mr-3" />
        <span className="text-lg">Opening manuscript in studio...</span>
      </div>
    )
  }

  const activeContent =
    contentType === 'book' && activeChapterIndex !== null && chapters[activeChapterIndex]
      ? chapters[activeChapterIndex].content
      : content

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* =========================================================================
          TOP STUDIO TOOLBAR
         ========================================================================= */}
      <header className="h-16 border-b border-border/80 bg-card/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        
        {/* Left: Library Back link & Title input */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 max-w-xl">
          <Link
            to="/my-posts"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex-shrink-0"
            title="Return to Library"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title your manuscript..."
            className="text-base sm:text-lg font-serif font-bold bg-transparent text-foreground placeholder-muted-foreground/60 border-none focus:outline-none focus:ring-0 w-full truncate"
          />
        </div>

        {/* Right: Autosave status, Panels toggle, Preview & Publish */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Autosave Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground pr-2 font-mono">
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-literary animate-pulse">
                <Cloud className="h-3.5 w-3.5" />
                <span>Saving...</span>
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Saved</span>
              </span>
            )}
            {autoSaveStatus === 'idle' && lastSaved && (
              <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-destructive">Save failed</span>
            )}
          </div>

          {/* Toggle Panels Buttons */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`p-2 rounded-lg border transition-colors ${
              leftSidebarOpen ? 'border-literary text-literary bg-literary/10' : 'border-border text-muted-foreground hover:bg-muted'
            }`}
            title="Toggle Manuscript Sidebar"
          >
            {leftSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          {/* Focus Mode Button */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`p-2 rounded-lg border transition-colors ${
              focusMode ? 'border-terracotta text-terracotta bg-terracotta/10' : 'border-border text-muted-foreground hover:bg-muted'
            }`}
            title="Focus Mode (Distraction-free)"
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Instant Preview Button */}
          {slug && (
            <Link
              to={`/post/${slug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground hover:bg-muted rounded-full text-xs font-medium transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </Link>
          )}

          {/* Publish Trigger Action */}
          <button
            onClick={() => setShowPublishModal(true)}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-literary text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-literary-hover transition-colors shadow-sm"
          >
            <Feather className="h-3.5 w-3.5" />
            <span>Publish...</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          STUDIO WORKSPACE: 3-PANEL LAYOUT
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: MANUSCRIPT & CHAPTERS */}
        {leftSidebarOpen && !focusMode && (
          <aside className="w-64 sm:w-72 border-r border-border bg-card/60 flex flex-col justify-between flex-shrink-0 animate-in slide-in-from-left duration-200">
            <div className="p-4 space-y-4 overflow-y-auto">
              
              {/* Content Form Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Manuscript Form
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setContentType('poem')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      contentType === 'poem'
                        ? 'border-terracotta bg-terracotta/15 text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                    <span>Poem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContentType('book')
                      if (chapters.length === 0) addChapter()
                    }}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      contentType === 'book'
                        ? 'border-literary bg-literary/15 text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-literary" />
                    <span>Book</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('journal')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      contentType === 'journal'
                        ? 'border-emerald-600 bg-emerald-600/15 text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Journal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('story')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      contentType === 'story'
                        ? 'border-indigo-600 bg-indigo-600/15 text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Feather className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Story</span>
                  </button>
                </div>
              </div>

              {/* BOOK CHAPTERS NAVIGATION */}
              {contentType === 'book' && (
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Chapters ({chapters.length})
                    </span>
                    <button
                      type="button"
                      onClick={addChapter}
                      className="inline-flex items-center gap-1 text-xs text-literary hover:text-literary-hover font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {chapters.map((ch, idx) => (
                      <div
                        key={idx}
                        className={`group flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                          activeChapterIndex === idx
                            ? 'bg-literary/15 text-foreground font-semibold border-l-2 border-literary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveChapterIndex(idx)}
                          className="flex-1 text-left truncate mr-2"
                        >
                          {ch.title || `Chapter ${idx + 1}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChapter(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Delete chapter"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Collaborators Entry */}
              {currentPostId && (
                <div className="pt-3 border-t border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Collaboration
                  </span>
                  <CollaboratorsBar
                    bookId={currentPostId || undefined}
                    ownerId={authorId || undefined}
                    chapterId={
                      contentType === 'book' && activeChapterIndex !== null && chapters[activeChapterIndex]
                        ? chapters[activeChapterIndex].id
                        : undefined
                    }
                  />
                </div>
              )}
            </div>

            {/* Bottom Metrics */}
            <div className="p-4 border-t border-border/60 text-xs text-muted-foreground space-y-1 bg-card">
              <div className="flex justify-between">
                <span>Words:</span>
                <span className="font-mono text-foreground font-medium">{stats.words}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters:</span>
                <span className="font-mono text-foreground font-medium">{stats.chars}</span>
              </div>
              <div className="flex justify-between">
                <span>Reading Time:</span>
                <span className="font-mono text-foreground font-medium">~{stats.readingTime} min</span>
              </div>
            </div>
          </aside>
        )}

        {/* CENTER WRITING CANVAS */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-14 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* If Book, editable Chapter Title */}
            {contentType === 'book' && activeChapterIndex !== null && chapters[activeChapterIndex] && (
              <div className="border-b border-border/60 pb-3">
                <input
                  type="text"
                  value={chapters[activeChapterIndex].title}
                  onChange={(e) => updateChapterTitle(activeChapterIndex, e.target.value)}
                  placeholder="Chapter Title..."
                  className="text-2xl sm:text-3xl font-serif font-bold text-foreground bg-transparent w-full focus:outline-none placeholder-muted-foreground/60"
                />
              </div>
            )}

            {/* Rich Text Editor */}
            <div className="min-h-[500px]">
              <TiptapEditor
                content={activeContent}
                onChange={handleEditorContentChange}
                placeholder={
                  contentType === 'poem'
                    ? 'Begin your verses here... Stanza breaks and indentation will be preserved.'
                    : 'Once upon a time in a quiet province...'
                }
                bookId={currentPostId || undefined}
                chapterId={
                  contentType === 'book' && activeChapterIndex !== null && chapters[activeChapterIndex]?.id
                    ? chapters[activeChapterIndex].id
                    : undefined
                }
              />
            </div>
          </div>
        </main>
      </div>

      {/* 5-Step Publishing Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublishSubmit}
        initialData={{
          title,
          contentType,
          coverImageUrl,
          description,
          tags,
          visibility,
          wordCount: stats.words,
          chapterCount: contentType === 'book' ? chapters.length : undefined,
        }}
      />
    </div>
  )
}
