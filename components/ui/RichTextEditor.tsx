"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({ content, onChange, placeholder = "Escribe aquí...", className = "", editable = true }: RichTextEditorProps) {
  const [_, forceUpdate] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onTransaction: () => {
      forceUpdate((x) => x + 1);
    },
    editorProps: {
        attributes: {
            class: "prose prose-sm dark:prose-invert focus:outline-none min-h-[100px] max-w-none"
        }
    }
  });

  useEffect(() => {
    if (editor && content === "") {
        editor.commands.setContent("");
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    let urlToSet = url;
    if (!/^https?:\/\//i.test(urlToSet)) {
        urlToSet = 'https://' + urlToSet;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: urlToSet }).run();
  };

  return (
    <div className={`border rounded-xl overflow-hidden bg-card border-card-border ${className}`}>
      {editable && (
          <div className="flex items-center gap-1 p-2 border-b border-card-border bg-subtle">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg hover:bg-dim transition-colors ${editor.isActive("bold") ? "bg-dim text-black dark:text-white" : "text-hint"}`}
              type="button"
            >
              <Bold size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg hover:bg-dim transition-colors ${editor.isActive("italic") ? "bg-dim text-black dark:text-white" : "text-hint"}`}
              type="button"
            >
              <Italic size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-lg hover:bg-dim transition-colors ${editor.isActive("underline") ? "bg-dim text-black dark:text-white" : "text-hint"}`}
              type="button"
            >
              <UnderlineIcon size={18} />
            </button>
            <button
              onClick={setLink}
              className={`p-2 rounded-lg hover:bg-dim transition-colors ${editor.isActive("link") ? "bg-dim text-black dark:text-white" : "text-hint"}`}
              type="button"
            >
              <LinkIcon size={18} />
            </button>
          </div>
      )}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
