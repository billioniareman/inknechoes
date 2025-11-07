import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'

interface ToolbarProps {
  editor: Editor
}

export default function Toolbar({ editor }: ToolbarProps) {
  return (
    <div className="border-b border-border p-2 flex items-center space-x-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('bold') ? 'bg-muted' : ''
        }`}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('italic') ? 'bg-muted' : ''
        }`}
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''
        }`}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''
        }`}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('bulletList') ? 'bg-muted' : ''
        }`}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('orderedList') ? 'bg-muted' : ''
        }`}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-muted ${
          editor.isActive('blockquote') ? 'bg-muted' : ''
        }`}
      >
        <Quote className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-border" />
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-muted"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-muted"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  )
}

