'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

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
        class: 'tiptap form-control',
        style: `min-height:${minHeight}px;padding:12px;background:#fff;color:#111`,
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

  if (!editor) return <div style={{ minHeight }}>Loading editor…</div>

  return (
    <div className="tiptap-wrap">
      <div style={{ marginBottom: 8 }}>
        <button
          type="button"
          className="btn btn-default btn-xs"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>{' '}
        <button
          type="button"
          className="btn btn-default btn-xs"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
