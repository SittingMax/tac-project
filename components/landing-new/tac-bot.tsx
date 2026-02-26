'use client';

import { Bot, CornerRightUp, Sparkles } from 'lucide-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
// import { useChat } from '@ai-sdk/react'; // Removed for UI-only mock
import Markdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

// Mock types for UI-only implementation
type Message = {
  id: string;
  role: 'user' | 'assistant';
  parts: { type: 'text'; text: string }[];
};

// Mock useChat hook
function useMockChat({ onFinish }: { onFinish?: (opts: { message: Message }) => void } = {}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'Khurumjari! I am TAC Bot. How can I help you with your logistics today?',
        },
      ],
    },
  ]);
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming'>('ready');

  const sendMessage = async ({ parts }: { parts: { type: 'text'; text: string }[] }) => {
    const userText = parts.map((p) => p.text).join('');
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: userText }],
    };

    setMessages((prev) => [...prev, userMsg]);
    setStatus('submitted');

    // Simulate network delay and streaming
    setTimeout(async () => {
      setStatus('streaming');
      const botMsgId = (Date.now() + 1).toString();
      // Determine response based on keywords for a bit more realism in the UI demo
      let responseText =
        'Thagatchari for your message! I am a simulated UI demo. In the real app, I would connect to the TAC AI backend to track shipments (e.g., TAC-12345) or answer service queries. How else can I assist?';

      if (
        userText.toLowerCase().includes('track') ||
        userText.toLowerCase().includes('CN Number')
      ) {
        responseText =
          'I can help with tracking! Please provide your **CN Number**, **Full Name**, and **Phone Number** so I can check the status.';
      } else if (
        userText.toLowerCase().includes('price') ||
        userText.toLowerCase().includes('rate')
      ) {
        responseText =
          'For accurate pricing, I need the **weight**, **dimensions**, and **destination** of your shipment. We offer Air Cargo and Surface Transport.';
      }

      // Streaming simulation
      let currentText = '';
      const words = responseText.split(' ');

      const botMsg: Message = {
        id: botMsgId,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };
      setMessages((prev) => [...prev, botMsg]);

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50)); // typing speed
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, parts: [{ type: 'text', text: currentText }] } : m
          )
        );
      }

      setStatus('ready');
      if (onFinish)
        onFinish({ message: { ...botMsg, parts: [{ type: 'text', text: currentText }] } });
    }, 1000);
  };

  return { messages, status, error: undefined, sendMessage };
}

function AiInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 150,
  });

  return (
    <div className="w-full">
      <div className="relative mx-auto flex w-full flex-col items-start gap-2">
        <div className="relative mx-auto w-full">
          <Textarea
            ref={textareaRef}
            placeholder="Ask me anything..."
            className={cn(
              'bg-muted/50 text-foreground ring-primary/20 placeholder:text-muted-foreground/70 w-full resize-none rounded-none border-none py-4 pr-12 pl-6 leading-[1.2] text-wrap',
              'focus:ring-primary/30 min-h-[56px] transition-all duration-200 focus:ring-2'
            )}
            value={value}
            onKeyDown={onKeyDown}
            onChange={(e) => {
              onChange(e);
              adjustHeight();
            }}
          />
          <button
            onClick={onSubmit}
            className={cn(
              'bg-primary/10 hover:bg-primary/20 absolute top-1/2 right-3 -translate-y-1/2 rounded-none p-2 transition-all duration-200',
              value.trim() ? 'opacity-100' : 'cursor-not-allowed opacity-50'
            )}
            type="button"
            disabled={!value.trim()}
          >
            <CornerRightUp
              className={cn(
                'text-primary h-4 w-4 transition-opacity',
                value ? 'opacity-100' : 'opacity-50'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TacBot() {
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({});
  const [input, setInput] = useState('');
  const startTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { messages, status, error, sendMessage } = useMockChat({
    onFinish: ({ message }) => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      setResponseTimes((prev) => ({ ...prev, [message.id]: duration }));
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim()) return;
      startTimeRef.current = Date.now();
      sendMessage({ parts: [{ type: 'text', text: input.trim() }] });
      setInput('');
    },
    [input, sendMessage, setInput]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-6 right-6 z-50">
          <span className="relative flex h-14 w-14 cursor-pointer">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-primary opacity-20 delay-1000"></span>
            <Button
              size="icon"
              className="relative h-14 w-14 rounded-none shadow-lg hover:shadow-xl hover:shadow-primary/30 bg-background border border-border/50 text-foreground transition-all duration-500 hover:scale-110"
            >
              <Sparkles className="h-6 w-6 text-primary fill-primary/20" />
            </Button>
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] w-[95vw] h-[600px] max-h-[85vh] p-0 gap-0 border-border/50 bg-background/95 backdrop-blur-lg shadow-2xl flex flex-col overflow-hidden data-[state=closed]:slide-out-to-bottom-[48%] data-[state=open]:slide-in-from-bottom-[48%] duration-500 rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 p-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 ring-1 ring-primary/20">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground leading-none">TAC Bot</h2>
              <p className="text-xs text-muted-foreground mt-1">AI Logistics Assistant</p>
            </div>
          </div>
          {/* Custom close button inside header if needed, but DialogContent usually handles it. We can supress default close and add our own if we want specific styling. */}
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gradient-to-b from-background to-muted/10"
        >
          {messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-1 animating-in slide-in-from-bottom-2 duration-300 fade-in"
              >
                <div
                  className={cn(
                    'flex w-max max-w-[85%] rounded-none px-5 py-3 text-sm shadow-sm',
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground rounded-none'
                      : 'bg-muted/80 backdrop-blur-md text-foreground rounded-none border border-border/50'
                  )}
                >
                  {m.role === 'assistant' ? (
                    <div className="markdown-body">
                      <Markdown>{m.parts.map((p) => p.text).join('')}</Markdown>
                    </div>
                  ) : (
                    <p>{m.parts.map((p) => p.text).join('')}</p>
                  )}
                </div>
                {responseTimes[m.id] && (
                  <span
                    className={cn(
                      'text-[10px] text-muted-foreground/60',
                      m.role === 'user' ? 'text-right mr-2' : 'ml-2'
                    )}
                  >
                    {responseTimes[m.id].toFixed(2)}s
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
              <Bot className="h-12 w-12 mb-2 text-primary/40" />
              <p className="text-sm">How can I help you today?</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 ml-1">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-none animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-none animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-none animate-bounce"></span>
              </div>
              <span className="text-primary/60 font-medium">Thinking...</span>
            </div>
          )}

          {error && (
            <div className="rounded-none bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              Something went wrong. Please try again.
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
          <AiInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
          />
          <p className="text-[10px] text-center text-muted-foreground/50 mt-2 select-none">
            TAC Bot can make mistakes. Verify important info.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
