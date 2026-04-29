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

const DEFAULT_EDITOR_FONT = '"Open Sans", Helvetica, Arial, sans-serif';

const PARAGRAPH_STYLE =
  "font-family: 'Open Sans', Helvetica, Arial, sans-serif; font-size: 18px; line-height: 32px; letter-spacing: -0.5px;";

const H1_STYLE =
  "font-family: 'Open Sans', Helvetica, Arial, sans-serif; font-size: 30px; line-height: 42px; font-weight: 800; letter-spacing: -1px;";

const H2_STYLE =
  "font-family: 'Open Sans', Helvetica, Arial, sans-serif; font-size: 24px; line-height: 36px; font-weight: 700; letter-spacing: -0.8px;";

const H3_STYLE =
  "font-family: 'Open Sans', Helvetica, Arial, sans-serif; font-size: 20px; line-height: 32px; font-weight: 700; letter-spacing: -0.6px;";

const FONT_OPTIONS = [
  { label: "Open Sans", value: DEFAULT_EDITOR_FONT },
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
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
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

function normalizeArticleHtml(rawHtml: string): string {
  if (!rawHtml?.trim()) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  doc.body.querySelectorAll("p").forEach((p) => {
    p.setAttribute("style", PARAGRAPH_STYLE);
  });

  doc.body.querySelectorAll("h1").forEach((h1) => {
    h1.setAttribute("style", H1_STYLE);
  });

  doc.body.querySelectorAll("h2").forEach((h2) => {
    h2.setAttribute("style", H2_STYLE);
  });

  doc.body.querySelectorAll("h3").forEach((h3) => {
    h3.setAttribute("style", H3_STYLE);
  });

  return doc.body.innerHTML;
}

function comparableHtml(rawHtml: string): string {
  return normalizeArticleHtml(rawHtml)
    .replace(/\sstyle="[^"]*"/gi, (match) => match.toLowerCase())
    .replace(/\s+/g, " ")
    .trim();
}

function hasUnsupportedShortcode(html: string): boolean {
  return /\[[a-z_][^\]]*\]/i.test(html);
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
          "tiptap-editor max-w-none min-h-[420px] px-5 py-4 focus:outline-none",
      },
    },
    onCreate: ({ editor }) => {
      const incoming = value || "";
      if (!incoming.trim()) return;
      isApplyingHtmlRef.current = true;
      editor.commands.setContent(incoming, false);
      queueMicrotask(() => {
        isApplyingHtmlRef.current = false;
      });
    },
    onUpdate: ({ editor }) => {
      if (isApplyingHtmlRef.current) return;
      if (mode !== "visual") return;

      const html = editor.getHTML();
      const normalizedHtml = normalizeArticleHtml(html);
      onChange(normalizedHtml);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (mode !== "visual") return;

    const current = comparableHtml(editor.getHTML());
    const incoming = comparableHtml(value || "");

    if (incoming !== current) {
      isApplyingHtmlRef.current = true;
      editor.commands.setContent(value || "", false);
      queueMicrotask(() => {
        isApplyingHtmlRef.current = false;
      });
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
    setHtmlDraft(value || editor.getHTML() || "");
    setMode("html");
  };

  const saveRawHtml = () => {
    const nextHtml = normalizeArticleHtml(htmlDraftRef.current || "");
    onChange(nextHtml);
    setHtmlDraft(nextHtml);
  };

  const convertHtmlToVisual = () => {
    const rawHtml = htmlDraftRef.current || "";

    if (hasUnsupportedShortcode(rawHtml)) {
      const nextHtml = normalizeArticleHtml(rawHtml);
      onChange(nextHtml);
      setHtmlDraft(nextHtml);
      window.alert(
        "Esse conteúdo foi mantido em HTML puro porque contém shortcode. " +
        "Salve assim no modo HTML."
      );
      return;
    }

    const nextHtml = normalizeArticleHtml(rawHtml);

    isApplyingHtmlRef.current = true;
    editor.commands.setContent(nextHtml, false);

    const normalizedHtml = normalizeArticleHtml(editor.getHTML());

    onChange(normalizedHtml);
    setHtmlDraft(normalizedHtml);
    setMode("visual");

    queueMicrotask(() => {
      isApplyingHtmlRef.current = false;
    });

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

  const resetInlineFormatting = () => {
    editor
      .chain()
      .focus()
      .unsetColor()
      .unsetHighlight()
      .unsetFontFamily()
      .unsetFontSize()
      .run();
  };

  const currentBlockType = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  const currentFontFamily =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) || DEFAULT_EDITOR_FONT;

  const currentFontSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) || "20px";

  return (
    <div className="tiptap-shell flex max-h-[95vh] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="tiptap-toolbar sticky top-0 z-20 flex shrink-0 flex-col gap-3 border-b border-border bg-background/95 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "visual" ? "default" : "ghost"}
              className="rounded-lg"
              onClick={() => {
                if (mode === "html") {
                  convertHtmlToVisual();
                  return;
                }
                setMode("visual");
              }}
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
          <>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={currentBlockType}
                onChange={(e) => {
                  const next = e.target.value;
                  const chain = editor.chain().focus();

                  if (next === "paragraph") chain.setParagraph().run();
                  if (next === "h1") chain.toggleHeading({ level: 1 }).run();
                  if (next === "h2") chain.toggleHeading({ level: 2 }).run();
                  if (next === "h3") chain.toggleHeading({ level: 3 }).run();
                }}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="paragraph">Parágrafo</option>
                <option value="h1">Título H1</option>
                <option value="h2">Subtítulo H2</option>
                <option value="h3">Subtítulo H3</option>
              </select>

              <select
                value={currentFontFamily}
                onChange={(e) => setFontFamilyValue(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                {FONT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background px-2 py-1">
                <span className="mr-1 text-xs text-muted-foreground">Tamanho:</span>
                {FONT_SIZE_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFontSizeValue(item.value)}
                    className={`rounded-lg px-2 py-1 text-sm transition ${currentFontSize === item.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-1 rounded-lg"
                  onClick={resetInlineFormatting}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <ToolbarButton
                title="Negrito"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Itálico"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Sublinhado"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Riscado"
                active={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Marca-texto"
                active={editor.isActive("highlight")}
                onClick={() => editor.chain().focus().toggleHighlight().run()}
              >
                <Highlighter className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarDivider />

              <ToolbarButton
                title="Alinhar à esquerda"
                active={editor.isActive({ textAlign: "left" })}
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Centralizar"
                active={editor.isActive({ textAlign: "center" })}
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Alinhar à direita"
                active={editor.isActive({ textAlign: "right" })}
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Justificar"
                active={editor.isActive({ textAlign: "justify" })}
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              >
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarDivider />

              <ToolbarButton
                title="Lista com marcadores"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Lista numerada"
                active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Checklist"
                active={editor.isActive("taskList")}
                onClick={() => editor.chain().focus().toggleTaskList().run()}
              >
                <CheckSquare className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Citação"
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Código"
                active={editor.isActive("codeBlock")}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <Code className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Linha horizontal"
                active={false}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarDivider />

              <ToolbarButton
                title="Inserir link"
                active={editor.isActive("link")}
                onClick={addLink}
              >
                <LinkIcon className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton title="Inserir imagem" active={false} onClick={addImage}>
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-2 py-1">
                <Palette className="mr-1 h-4 w-4 text-muted-foreground" />
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="h-7 w-7 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-lg"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                <Eraser className="mr-1.5 h-4 w-4" />
                Cor
              </Button>

              <ToolbarDivider />

              <ToolbarButton
                title="Desfazer"
                active={false}
                disabled={!editor.can().chain().focus().undo().run()}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo2 className="h-4 w-4" />
              </ToolbarButton>

              <ToolbarButton
                title="Refazer"
                active={false}
                disabled={!editor.can().chain().focus().redo().run()}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo2 className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </>
        )}

        {mode === "html" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={convertHtmlToVisual} className="rounded-xl">
              Converter HTML para visual
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={saveRawHtml}
              className="rounded-xl"
            >
              Salvar HTML puro
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

      {mode === "visual" ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border bg-background">
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
            HTML do artigo
          </div>

          <textarea
            value={htmlDraft}
            onChange={(e) => {
              const nextHtml = e.target.value;
              setHtmlDraft(nextHtml);
              onChange(normalizeArticleHtml(nextHtml));
            }}
            spellCheck={false}
            className="block min-h-[900px] w-full resize-none border-0 bg-background px-4 py-4 font-mono text-sm outline-none"
            placeholder="<p>Seu HTML aqui...</p>"
          />
        </div>
      )}
    </div>
  );
}