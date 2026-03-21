'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { btnSecondary } from '@/lib/ui'
import { cn } from '@/lib/cn'

export function TipTapEditor({
  value,
  onChange,
  minHeight = 200,
}: {
  value: string
  onChange: (html: string) => void
  minHeight?: number
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'tiptap max-w-none min-h-[120px] rounded-md border border-stone-600 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600',
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) return <div className="min-h-[120px] text-stone-500">Loading editor…</div>

  return (
    <div className="tiptap-wrap">
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          className={cn(btnSecondary, 'px-2 py-1 text-xs')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={cn(btnSecondary, 'px-2 py-1 text-xs')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
