import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Typography from "@tiptap/extension-typography";
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Underline as UnderlineIcon,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CheckSquare,
  Minus,
  Eraser,
  Eye,
  Code2,
  Palette,
} from "lucide-react";
import { Button } from "./ui/button";
import "./TipTapEditor.css";

type EditorMode = "visual" | "html";

interface TipTapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  defaultMode?: EditorMode;
}

const FONT_OPTIONS = [
  { label: "Padrão", value: "inherit" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: '"Times New Roman", serif' },
  { label: "Monospace", value: '"JetBrains Mono", monospace' },
];

const FONT_SIZE_OPTIONS = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
];

const COLOR_OPTIONS = [
  "#111827",
  "#374151",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#ea580c",
  "#16a34a",
];

const CustomImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        class: "rounded-xl my-4 max-w-full h-auto border border-border",
      }),
    ];
  },
});

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function ToolbarDivider() {
  return <div className="mx-1 h-7 w-px bg-border/80" />;
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({
  active = false,
  onClick,
  title,
  disabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-9 min-w-9 rounded-xl px-2"
    >
      {children}
    </Button>
  );
}

export default function TipTapEditor({
  value,
  onChange,
  placeholder = "Escreva seu artigo aqui...",
  defaultMode = "visual",
}: TipTapEditorProps) {
  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [htmlDraft, setHtmlDraft] = useState(value || "");
  const htmlDraftRef = useRef(htmlDraft);
  const isApplyingHtmlRef = useRef(false);

  useEffect(() => {
    htmlDraftRef.current = htmlDraft;
  }, [htmlDraft]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
      CustomImage.configure({
        allowBase64: true,
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      HorizontalRule,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Typography,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[420px] px-5 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (isApplyingHtmlRef.current) return;
      if (mode !== "visual") return;

      const html = editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (mode !== "visual") return;

    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor, mode]);

  useEffect(() => {
    if (mode === "html") {
      setHtmlDraft(value || "");
    }
  }, [mode, value]);

  const stats = useMemo(() => {
    const text = stripHtml(value);
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    return { words, chars };
  }, [value]);

  if (!editor) {
    return null;
  }

  const openHtmlMode = () => {
    setHtmlDraft(editor.getHTML() || value || "");
    setMode("html");
  };

  const applyHtml = () => {
    const nextHtml = htmlDraftRef.current || "";

    isApplyingHtmlRef.current = true;
    editor.commands.setContent(nextHtml, false);
    onChange(nextHtml);
    queueMicrotask(() => {
      isApplyingHtmlRef.current = false;
    });
  };

  const backToVisual = () => {
    applyHtml();
    setMode("visual");
    requestAnimationFrame(() => {
      editor.commands.focus("end");
    });
  };

  const cancelHtmlChanges = () => {
    setHtmlDraft(value || "");
  };

  const addImage = () => {
    const url = window.prompt("URL da imagem:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("URL do link:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const setFontFamilyValue = (font: string) => {
    if (font === "inherit") {
      editor.chain().focus().unsetFontFamily().run();
      return;
    }

    editor.chain().focus().setFontFamily(font).run();
  };

  const setFontSizeValue = (size: string) => {
    if (size === "default") {
      editor.chain().focus().unsetFontSize().run();
      return;
    }

    editor.chain().focus().setFontSize(size).run();
  };

  const currentBlockType = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "visual" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => setMode("visual")}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Visual
            </Button>

            <Button
              type="button"
              size="sm"
              variant={mode === "html" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={openHtmlMode}
            >
              <Code2 className="mr-1.5 h-4 w-4" />
              HTML
            </Button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.words} palavras</span>
            <span>•</span>
            <span>{stats.chars} caracteres</span>
          </div>
        </div>

        {mode === "visual" && (
          <div className="flex flex-wrap items-center gap-1">
            <select
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              value={currentBlockType}
              onChange={(e) => {
                const nextValue = e.target.value;

                if (nextValue === "paragraph") {
                  editor.chain().focus().setParagraph().run();
                } else if (nextValue === "h1") {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                } else if (nextValue === "h2") {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                } else if (nextValue === "h3") {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                }
              }}
            >
              <option value="paragraph">Parágrafo</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
            </select>

            <select
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
              defaultValue="inherit"
              onChange={(e) => setFontFamilyValue(e.target.value)}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1">
              <span className="px-2 text-xs text-muted-foreground">Tamanho:</span>
              {FONT_SIZE_OPTIONS.map((size) => (
                <ToolbarButton
                  key={size.value}
                  active={editor.isActive("textStyle", { fontSize: size.value })}
                  onClick={() => setFontSizeValue(size.value)}
                  title={`Tamanho ${size.label}px`}
                >
                  <span className="text-xs font-medium">{size.label}</span>
                </ToolbarButton>
              ))}
              <ToolbarButton
                active={!editor.isActive("textStyle")}
                onClick={() => setFontSizeValue("default")}
                title="Tamanho padrão"
              >
                <span className="text-xs font-medium">Reset</span>
              </ToolbarButton>
            </div>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Negrito"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Itálico"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Sublinhado"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Tachado"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("highlight")}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              title="Destacar"
            >
              <Highlighter className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              title="Alinhar à esquerda"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              title="Centralizar"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Alinhar à direita"
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "justify" })}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              title="Justificar"
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Lista com marcadores"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("taskList")}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Checklist"
            >
              <CheckSquare className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Citação"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Bloco de código"
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Linha horizontal"
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("link")}
              onClick={addLink}
              title="Adicionar link"
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton onClick={addImage} title="Adicionar imagem">
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <ToolbarButton
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              title="Limpar formatação"
            >
              <Eraser className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Desfazer"
            >
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Refazer"
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </div>
        )}

        {mode === "html" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={backToVisual} className="rounded-xl">
              Aplicar HTML e voltar ao visual
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={applyHtml}
              className="rounded-xl"
            >
              Aplicar HTML
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={cancelHtmlChanges}
              className="rounded-xl"
            >
              Descartar alterações do HTML
            </Button>
          </div>
        )}
      </div>

      {mode === "visual" && (
        <div className="bg-background">
          <EditorContent editor={editor} className="tiptap-editor-modern" />
        </div>
      )}

      {mode === "html" && (
        <div className="bg-background p-0">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground">
            <Code2 className="h-4 w-4" />
            HTML do artigo
          </div>

          <textarea
            value={htmlDraft}
            onChange={(e) => setHtmlDraft(e.target.value)}
            spellCheck={false}
            className="min-h-[520px] w-full resize-none border-0 bg-background px-4 py-4 font-mono text-sm outline-none"
            placeholder="<p>Seu HTML aqui...</p>"
          />
        </div>
      )}
    </div>
  );
}