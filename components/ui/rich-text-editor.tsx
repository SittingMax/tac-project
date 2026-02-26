'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import {
  memo,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  ImageIcon,
  Minus,
  Type,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';

export interface RichTextEditorRef {
  getHTML: () => string;
  getJSON: () => Record<string, unknown>;
  getText: () => string;
  setContent: (content: string) => void;
  clearContent: () => void;
  focus: () => void;
  editor: Editor | null;
}

export interface RichTextEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  editable?: boolean;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  showToolbar?: boolean;
  toolbarVariant?: 'full' | 'minimal' | 'basic';
  autofocus?: boolean;
}

interface ToolbarButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

const ToolbarButton = memo(
  forwardRef<HTMLButtonElement, ToolbarButtonProps>(
    ({ onClick, isActive, disabled, tooltip, children }, ref) => (
      <TooltipPrimitive.Provider delayDuration={300}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild ref={ref}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClick}
              disabled={disabled}
              className={cn(
                'h-7 w-7 p-0 rounded-none transition-all duration-150',
                'hover:bg-muted/80 hover:text-foreground',
                isActive && 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20',
                disabled && 'opacity-30'
              )}
            >
              {children}
            </Button>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="bottom"
              className="z-50 overflow-hidden rounded-none bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg border border-border/50 animate-in fade-in-0 zoom-in-95"
              sideOffset={6}
            >
              {tooltip}
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    )
  )
);
ToolbarButton.displayName = 'ToolbarButton';

const ToolbarDivider = memo(() => <div className="mx-0.5 h-5 w-px bg-border/60" />);
ToolbarDivider.displayName = 'ToolbarDivider';

/** Grouped cluster of toolbar buttons */
const ToolbarGroup = memo<{ children: React.ReactNode; label?: string }>(({ children, label }) => (
  <div className="flex items-center gap-0.5 rounded-none bg-muted/40 p-0.5" aria-label={label}>
    {children}
  </div>
));
ToolbarGroup.displayName = 'ToolbarGroup';

/** Link insertion popover */
const LinkPopover = memo<{ editor: Editor }>(({ editor }) => {
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    setUrl(previousUrl || '');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [editor]);

  const handleSubmit = useCallback(() => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setOpen(false);
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return;
    } catch {
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setOpen(false);
  }, [editor, url]);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) handleOpen();
        setOpen(isOpen);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <ToolbarButton isActive={editor.isActive('link')} tooltip="Add Link" onClick={() => {}}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-50 w-72 rounded-none bg-popover border border-border/60 shadow-xl p-3 animate-in fade-in-0 zoom-in-95"
        >
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
            URL
          </label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm bg-background"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSubmit}>
              Set
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
LinkPopover.displayName = 'LinkPopover';

/** Image insertion popover */
const ImagePopover = memo<{ editor: Editor }>(({ editor }) => {
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (url) {
      try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol)) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch {
        // Invalid URL, ignore
      }
    }
    setUrl('');
    setOpen(false);
  }, [editor, url]);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <ToolbarButton tooltip="Add Image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-50 w-72 rounded-none bg-popover border border-border/60 shadow-xl p-3 animate-in fade-in-0 zoom-in-95"
        >
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Image URL
          </label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="h-8 text-sm bg-background"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSubmit}>
              Add
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
ImagePopover.displayName = 'ImagePopover';

interface EditorToolbarProps {
  editor: Editor | null;
  variant: 'full' | 'minimal' | 'basic';
}

const EditorToolbar = memo<EditorToolbarProps>(({ editor, variant }) => {
  if (!editor) return null;

  const basicTools = (
    <ToolbarGroup label="Text formatting">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        tooltip="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        tooltip="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        tooltip="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  const formattingTools = (
    <ToolbarGroup label="Extended formatting">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        tooltip="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        tooltip="Inline Code"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        tooltip="Highlight"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  const headingTools = (
    <ToolbarGroup label="Headings">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        tooltip="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        tooltip="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        tooltip="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  const listTools = (
    <ToolbarGroup label="Lists">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        tooltip="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        tooltip="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        tooltip="Task List"
      >
        <ListChecks className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        tooltip="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  const alignmentTools = (
    <ToolbarGroup label="Alignment">
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        tooltip="Align Left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        tooltip="Align Center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        tooltip="Align Right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        tooltip="Justify"
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  const insertTools = (
    <ToolbarGroup label="Insert">
      <LinkPopover editor={editor} />
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        tooltip="Remove Link"
      >
        <Unlink className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ImagePopover editor={editor} />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        tooltip="Horizontal Rule"
      >
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  const historyTools = (
    <ToolbarGroup label="History">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Undo (Ctrl+Z)"
      >
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Redo (Ctrl+Y)"
      >
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>
    </ToolbarGroup>
  );

  if (variant === 'basic') {
    return (
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 bg-muted/20 px-2.5 py-2">
        {basicTools}
        {historyTools}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 bg-muted/20 px-2.5 py-2">
        {basicTools}
        {formattingTools}
        {listTools}
        {historyTools}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 bg-muted/20 px-2.5 py-2">
      {basicTools}
      {formattingTools}
      {headingTools}
      {listTools}
      {alignmentTools}
      {insertTools}
      {historyTools}
    </div>
  );
});
EditorToolbar.displayName = 'EditorToolbar';

/** Footer bar with word/character count */
const EditorFooter = memo<{ editor: Editor }>(({ editor }) => {
  const characters = editor.storage.characterCount?.characters() ?? 0;
  const words = editor.storage.characterCount?.words() ?? 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex items-center justify-between border-t border-border/50 bg-muted/10 px-3 py-1.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Type className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] font-mono text-muted-foreground/70">
            {words} {words === 1 ? 'word' : 'words'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] font-mono text-muted-foreground/70">{characters} chars</span>
        </div>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground/50">
        ~{readingTime} min read
      </span>
    </div>
  );
});
EditorFooter.displayName = 'EditorFooter';

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content = '',
      placeholder = 'Start typing...',
      onChange,
      onBlur,
      editable = true,
      className,
      minHeight = '120px',
      maxHeight = '400px',
      showToolbar = true,
      toolbarVariant = 'full',
      autofocus = false,
    },
    ref
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({ placeholder }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class:
              'text-primary underline decoration-primary/40 cursor-pointer hover:decoration-primary transition-colors',
          },
        }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }),
        TextStyle,
        Color,
        TaskList,
        TaskItem.configure({ nested: true }),
        Image.configure({ inline: true }),
        CharacterCount,
      ],
      content,
      editable,
      autofocus,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onBlur: () => {
        onBlur?.();
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3',
            'prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight',
            'prose-p:text-foreground prose-p:leading-relaxed',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:text-sm prose-code:font-mono',
            'prose-blockquote:border-l-primary/60 prose-blockquote:text-muted-foreground prose-blockquote:pl-4',
            'prose-ul:list-disc prose-ol:list-decimal',
            '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
            '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:gap-2 [&_ul[data-type="taskList"]_li]:items-start',
            '[&_ul[data-type="taskList"]_li_label]:mt-0.5',
            '[&_.tiptap-placeholder::before]:text-muted-foreground/40 [&_.tiptap-placeholder::before]:font-normal'
          ),
        },
      },
      immediatelyRender: false,
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? '',
      getJSON: () => editor?.getJSON() ?? {},
      getText: () => editor?.getText() ?? '',
      setContent: (newContent: string) => editor?.commands.setContent(newContent),
      clearContent: () => editor?.commands.clearContent(),
      focus: () => editor?.commands.focus(),
      editor,
    }));

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    useEffect(() => {
      if (editor) {
        editor.setEditable(editable);
      }
    }, [editable, editor]);

    if (!editor) {
      return (
        <div
          className={cn('rounded-none border border-input bg-background animate-pulse', className)}
          style={{ minHeight }}
        />
      );
    }

    return (
      <div
        className={cn(
          'rounded-none border border-input bg-background overflow-hidden transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40',
          !editable && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        {showToolbar && editable && <EditorToolbar editor={editor} variant={toolbarVariant} />}

        <div className="overflow-y-auto" style={{ minHeight, maxHeight }}>
          <EditorContent editor={editor} />
        </div>
        {editable && <EditorFooter editor={editor} />}
      </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';

export const RichTextViewer = memo<{
  content: string;
  className?: string;
}>(({ content, className }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyle,
      Color,
      TaskList,
      TaskItem,
      Image,
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight',
        'prose-p:text-foreground prose-p:leading-relaxed',
        'prose-a:text-primary hover:prose-a:underline',
        '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
        className
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
});
RichTextViewer.displayName = 'RichTextViewer';

export default RichTextEditor;
