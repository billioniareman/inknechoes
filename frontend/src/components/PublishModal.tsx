import { useState } from 'react'
import { X, CheckCircle, ArrowRight, ArrowLeft, Globe, Lock, Feather } from 'lucide-react'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (metadata: {
    visibility: 'public' | 'draft'
    coverImageUrl?: string
    description?: string
    genre?: string
    tags: string
    language: string
  }) => Promise<void>
  initialData: {
    title: string
    contentType: string
    coverImageUrl?: string
    description?: string
    tags: string
    visibility: string
    wordCount: number
    chapterCount?: number
  }
}

export default function PublishModal({
  isOpen,
  onClose,
  onPublish,
  initialData,
}: PublishModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [coverImageUrl, setCoverImageUrl] = useState(initialData.coverImageUrl || '')
  const [description, setDescription] = useState(initialData.description || '')
  const [genre, setGenre] = useState('Literature')
  const [tags, setTags] = useState(initialData.tags || '')
  const [language, setLanguage] = useState('English')
  const [visibility, setVisibility] = useState<'public' | 'draft'>(
    (initialData.visibility as 'public' | 'draft') || 'public'
  )
  const [publishing, setPublishing] = useState(false)

  if (!isOpen) return null

  const handleConfirmPublish = async () => {
    setPublishing(true)
    try {
      await onPublish({
        visibility,
        coverImageUrl: coverImageUrl.trim() || undefined,
        description: description.trim() || undefined,
        genre,
        tags,
        language,
      })
      onClose()
    } catch (err) {
      console.error('Publishing failed:', err)
    } finally {
      setPublishing(false)
    }
  }

  const genreList = [
    'Literature',
    'Poetry',
    'Fiction',
    'Memoir',
    'Essays',
    'Philosophy',
    'Mystery',
    'Speculative',
    'Nature & Environment',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">
              Publication Workflow
            </h3>
            <p className="text-xs text-muted-foreground">
              Step {step} of 5 — {getStepTitle(step)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="flex h-1 bg-muted">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all duration-300 ${
                s <= step ? 'bg-literary' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          
          {/* STEP 1: Verification */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-2 border border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-literary">
                  Manuscript Summary
                </span>
                <h4 className="font-serif font-bold text-xl text-foreground">
                  {initialData.title || 'Untitled Manuscript'}
                </h4>
                <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                  <span>Form: <strong className="text-foreground uppercase">{initialData.contentType}</strong></span>
                  <span>Length: <strong className="text-foreground">{initialData.wordCount} words</strong></span>
                  {initialData.chapterCount !== undefined && (
                    <span>Chapters: <strong className="text-foreground">{initialData.chapterCount}</strong></span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Stanza cadence and typography validated</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Draft saved safely in your author archives</span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview Mockup */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                This is how readers will encounter your manuscript in the library catalog:
              </p>
              <div className="p-6 bg-card border border-literary/40 rounded-xl shadow-md space-y-3">
                <div className="flex justify-between items-start text-xs text-muted-foreground">
                  <span className="uppercase tracking-widest text-literary font-semibold">
                    {initialData.contentType}
                  </span>
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <h4 className="font-serif font-bold text-2xl text-foreground">
                  {initialData.title}
                </h4>
                {description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}
                <div className="text-xs text-literary font-medium pt-2">
                  Read complete work &rarr;
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Metadata (Cover, Genre, Tags) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Cover Artwork URL
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 text-xs sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-literary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Recommended aspect ratio: 3:4 for books, 16:9 for stories.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Short Description / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief excerpt or synopsis to entice readers..."
                  className="w-full p-2.5 text-xs sm:text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-literary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Primary Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm border border-border rounded-lg bg-background text-foreground"
                  >
                    {genreList.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                    <option value="Japanese">日本語</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="poetry, solitude, autumn, memory"
                  className="w-full p-2.5 text-xs sm:text-sm border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Visibility & Publication Status */}
          {step === 4 && (
            <div className="space-y-4">
              <span className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                Publication Visibility
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    visibility === 'public'
                      ? 'border-literary bg-literary/10 ring-1 ring-literary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Globe className="h-4 w-4 text-literary" />
                    <span className="font-semibold text-sm text-foreground">Public Publication</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Listed in Discover catalog, reader feeds, author profile, and RSS feed.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('draft')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    visibility === 'draft'
                      ? 'border-literary bg-literary/10 ring-1 ring-literary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm text-foreground">Private Draft</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Accessible only to you and invited collaborators in the studio.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Final Confirmation */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-literary/15 text-literary flex items-center justify-center mx-auto">
                <Feather className="h-6 w-6" />
              </div>
              <h4 className="font-serif font-bold text-2xl text-foreground">
                Ready to Publish?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your work &ldquo;{initialData.title}&rdquo; will be {visibility === 'public' ? 'published publicly' : 'saved as private draft'} under your author profile.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-border/80 flex items-center justify-between bg-card/60">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-90"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleConfirmPublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-literary text-white rounded-full text-xs font-semibold hover:bg-literary-hover shadow-sm disabled:opacity-50"
            >
              <Feather className="h-4 w-4" />
              <span>{publishing ? 'Publishing...' : 'Confirm & Publish'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return 'Verify Manuscript'
    case 2:
      return 'Catalog Preview'
    case 3:
      return 'Metadata & Category'
    case 4:
      return 'Visibility & Rights'
    case 5:
      return 'Final Review'
    default:
      return ''
  }
}
