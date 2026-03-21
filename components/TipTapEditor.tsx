'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import type { Editor } from '@tiptap/core'
import { useEffect, useMemo, useRef } from 'react'
import { TipTapToolbar } from '@/components/TipTapToolbar'
import { uploadEditorImage } from '@/lib/tiptap-upload'
import { cn } from '@/lib/cn'

export function TipTapEditor({
  value,
  onChange,
  minHeight = 200,
  placeholder = 'Start writing…',
}: {
  value: string
  onChange: (html: string) => void
  minHeight?: number
  /** Shown when the document is empty */
  placeholder?: string
}) {
  const editorRef = useRef<Editor | null>(null)

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-700 underline',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: false,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [placeholder]
  )

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: value || '',
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed
    },
    onDestroy: () => {
      editorRef.current = null
    },
    editorProps: {
      attributes: {
        class: cn(
          'tiptap max-w-none min-h-[120px] rounded-md border border-stone-600 bg-white px-3 py-2 text-sm text-stone-900',
          'focus:outline-none focus:ring-2 focus:ring-amber-600'
        ),
        style: `min-height:${minHeight}px`,
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items?.length) return false
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              event.preventDefault()
              void uploadEditorImage(file)
                .then((url) => {
                  editorRef.current?.chain().focus().setImage({ src: url }).run()
                })
                .catch((err: unknown) => {
                  console.error(err)
                  window.alert(err instanceof Error ? err.message : 'Image upload failed')
                })
              return true
            }
          }
        }
        return false
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        const file = files[0]
        if (!file.type.startsWith('image/')) return false
        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        void uploadEditorImage(file)
          .then((url) => {
            const ed = editorRef.current
            if (!ed) return
            const pos = coords?.pos ?? ed.state.selection.from
            ed.chain().focus().insertContentAt(pos, { type: 'image', attrs: { src: url } }).run()
          })
          .catch((err: unknown) => {
            console.error(err)
            window.alert(err instanceof Error ? err.message : 'Image upload failed')
          })
        return true
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) {
    return <div className="min-h-[120px] rounded-md border border-stone-600 bg-stone-900/50 px-3 py-4 text-sm text-stone-500">Loading editor…</div>
  }

  return (
    <div className="tiptap-wrap">
      <TipTapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
