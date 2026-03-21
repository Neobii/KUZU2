'use client'

import type { Editor } from '@tiptap/core'
import type { ChangeEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { btnSecondary } from '@/lib/ui'
import { uploadEditorImage } from '@/lib/tiptap-upload'

const HIGHLIGHT_PRESETS = [
  { label: 'Y', title: 'Highlight yellow', color: '#fef08a' },
  { label: 'G', title: 'Highlight green', color: '#bbf7d0' },
  { label: 'P', title: 'Highlight pink', color: '#fbcfe8' },
  { label: 'B', title: 'Highlight blue', color: '#bfdbfe' },
] as const

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        btnSecondary,
        'min-h-[32px] px-2 py-1 text-xs font-medium',
        active && 'bg-amber-600 text-white hover:bg-amber-700',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1 border-r border-stone-700 pr-2 last:border-r-0 last:pr-0">{children}</div>
}

export function TipTapToolbar({ editor }: { editor: Editor | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!editor) return null

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const next = window.prompt('Link URL', previous ?? 'https://')
    if (next === null) return
    if (next === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: next }).run()
  }

  const addImageFromUrl = () => {
    const src = window.prompt('Image URL', 'https://')
    if (!src) return
    editor.chain().focus().setImage({ src }).run()
  }

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const url = await uploadEditorImage(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      console.error(err)
      window.alert(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="mb-2 flex flex-wrap gap-x-2 gap-y-2 rounded-lg border border-stone-600 bg-stone-900/90 p-2"
      role="toolbar"
      aria-label="Formatting"
    >
      <ToolbarGroup>
        <ToolbarBtn
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarBtn>
        <ToolbarBtn
          title="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          {'</>'}
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Subscript"
          active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          X<sub>2</sub>
        </ToolbarBtn>
        <ToolbarBtn
          title="Superscript"
          active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          X<sup>2</sup>
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarBtn>
        <ToolbarBtn
          title="Paragraph"
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          ¶
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarBtn>
        <ToolbarBtn
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “ ”
        </ToolbarBtn>
        <ToolbarBtn
          title="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {'{ }'}
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          HR
        </ToolbarBtn>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={setLink}>
          Link
        </ToolbarBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={onFileChange}
        />
        <ToolbarBtn
          title="Upload image from your device"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? '…' : 'Upload'}
        </ToolbarBtn>
        <ToolbarBtn title="Insert image by URL" disabled={uploading} onClick={addImageFromUrl}>
          Image URL
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Align left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          Left
        </ToolbarBtn>
        <ToolbarBtn
          title="Align center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          Center
        </ToolbarBtn>
        <ToolbarBtn
          title="Align right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          Right
        </ToolbarBtn>
        <ToolbarBtn
          title="Justify"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          Justify
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <label className="flex cursor-pointer items-center gap-1 text-xs text-stone-400" title="Text color">
          <span className="sr-only">Text color</span>
          <input
            type="color"
            className="h-8 w-9 cursor-pointer rounded border border-stone-600 bg-stone-800 p-0.5"
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value
              editor.chain().focus().setColor(v).run()
            }}
          />
        </label>
        <ToolbarBtn title="Reset text color" onClick={() => editor.chain().focus().unsetColor().run()}>
          No color
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        {HIGHLIGHT_PRESETS.map(({ label, title, color }) => (
          <ToolbarBtn
            key={color}
            title={title}
            active={editor.isActive('highlight', { color })}
            onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
          >
            <span className="rounded px-0.5" style={{ backgroundColor: color }}>
              {label}
            </span>
          </ToolbarBtn>
        ))}
        <ToolbarBtn title="Remove highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}>
          ✕ hl
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Insert table (3×3)"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          +Table
        </ToolbarBtn>
        <ToolbarBtn
          title="Add row after"
          disabled={!editor.can().addRowAfter()}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          +Row
        </ToolbarBtn>
        <ToolbarBtn
          title="Add column after"
          disabled={!editor.can().addColumnAfter()}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          +Col
        </ToolbarBtn>
        <ToolbarBtn
          title="Delete table"
          disabled={!editor.can().deleteTable()}
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          −Table
        </ToolbarBtn>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarBtn
          title="Clear inline formatting (bold, italic, color, links…)"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
        >
          Clear marks
        </ToolbarBtn>
      </ToolbarGroup>
    </div>
  )
}
