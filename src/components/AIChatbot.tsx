import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function getFinancialContext(): string {
  try {
    const raw = sessionStorage.getItem('finance_context');
    if (!raw) return '';
    const ctx = JSON.parse(raw);
    const fmt = (n: number) => (n ?? 0).toLocaleString('en-EG', { maximumFractionDigits: 0 });
    return `
User's current financial snapshot:
- Net Worth: ${fmt(ctx.netWorth)} EGP
- Cash: ${fmt(ctx.cashEGP)} EGP
- Gold: ${ctx.goldGrams ?? 0}g worth ${fmt(ctx.goldValueEGP)} EGP
- USD held: $${fmt(ctx.usdAmount)} ≈ ${fmt(ctx.usdValueEGP)} EGP
- Monthly Income: ${fmt(ctx.incomingMonthly)} EGP
- Total Freelancing Income: ${fmt(ctx.totalFreelancing)} EGP
- This Month's Spending: ${fmt(ctx.monthTotal)} EGP
- Monthly Subscriptions: ${fmt(ctx.totalMonthlySubsEGP)} EGP
`.trim();
  } catch {
    return '';
  }
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm your personal finance AI. I can see your financial data and help with budgeting, savings goals, investment ideas, or any money questions. What would you like to know?",
        }]);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const context = getFinancialContext();
      const systemPrompt = [
        'You are a smart, friendly personal financial advisor for a user based in Egypt.',
        'Be concise (2-4 sentences max unless detail is needed), practical, and encouraging.',
        'Use EGP as the primary currency. Mention USD/gold when relevant.',
        context ? `\n${context}` : '',
      ].join(' ');

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: systemPrompt,
        },
      });

      if (error) throw new Error(error.message);

      const reply = data?.content?.[0]?.text;
      if (!reply) throw new Error('Empty response from AI');

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Could not reach the AI: ${msg}. Make sure ANTHROPIC_API_KEY is set in Supabase Secrets.`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button — above mobile nav bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300"
        style={{
          bottom: 80, right: 20,
          width: 52, height: 52,
          background: open ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.18)',
          border: '1px solid rgba(168,85,247,0.6)',
          boxShadow: '0 0 24px rgba(168,85,247,0.4)',
          color: '#c084fc',
        }}
        title="AI Financial Advisor">
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed z-40 flex flex-col"
          style={{
            bottom: 144, right: 16,
            width: 'min(360px, calc(100vw - 32px))',
            height: 'min(500px, calc(100vh - 200px))',
            background: 'rgba(10,10,10,0.98)',
            border: '1px solid rgba(168,85,247,0.35)',
            borderRadius: 16,
            boxShadow: '0 0 60px rgba(168,85,247,0.2)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(168,85,247,0.12)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)' }}>
              <Bot size={14} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Finance AI</p>
              <p className="text-xs font-mono" style={{ color: 'rgba(168,85,247,0.6)' }}>Powered by Claude</p>
            </div>
            <div className="ml-auto live-dot" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ overscrollBehavior: 'contain' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                    <Bot size={12} style={{ color: '#a855f7' }} />
                  </div>
                )}
                <div className="max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === 'user' ? {
                    background: 'rgba(168,85,247,0.18)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    color: '#e2e8f0',
                    borderBottomRightRadius: 4,
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#cbd5e1',
                    borderBottomLeftRadius: 4,
                  }}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
                    <User size={12} style={{ color: '#c084fc' }} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <Bot size={12} style={{ color: '#a855f7' }} />
                </div>
                <div className="rounded-2xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#a855f7', animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 pb-3 pt-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(168,85,247,0.08)' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Ask anything about your finances..."
              className="flex-1 text-sm outline-none rounded-xl px-3 py-2 text-white placeholder-slate-600"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', fontFamily: 'Space Grotesk' }}
              disabled={loading}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7' }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
