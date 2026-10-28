'use client';

import { Award, Check, CheckCheck, Heart, Lock, SendHorizontal, Sparkles, ThumbsUp, type LucideIcon } from 'lucide-react';
import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MESSAGE_MAX_LENGTH, todayIn, type Locale, type MessageDTO } from '@ruya/shared';
import { FormAlert } from '@/components/FormAlert';
import { apiGet, apiPost } from '@/lib/client';
import { dictionaries, formatClock, formatDayLong, type EncouragementId } from '@/lib/i18n';

const PRESET_ICONS: Record<EncouragementId, LucideIcon> = {
  great: ThumbsUp,
  proud: Award,
  love: Heart,
  luck: Sparkles,
};

/** How often an open conversation checks for new messages. Sockets can replace this later. */
const POLL_MS = 10_000;

type Props = {
  locale: Locale;
  childId: string;
  parentId: string;
  initial: MessageDTO[];
  privacyNote: string;
  /** Parents get quick encouragement phrases (US-15). */
  showPresets: boolean;
};

function mergeById(older: MessageDTO[], newer: MessageDTO[]) {
  const map = new Map(older.map((m) => [m.id, m]));
  for (const m of newer) map.set(m.id, m);
  return [...map.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** US-14/15: one private conversation between a child and one parent. */
export function ChatThread({ locale, childId, parentId, initial, privacyNote, showPresets }: Props) {
  const t = dictionaries[locale];
  const m = t.messages;
  const base = `/api/children/${childId}/conversations/${parentId}`;

  const [messages, setMessages] = useState(initial);
  const [hasOlder, setHasOlder] = useState(initial.length >= 50);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // A phrase lands in the composer so it can still be edited, then the panel closes.
  function pickPreset(text: string) {
    setDraft(text);
    setPresetsOpen(false);
    inputRef.current?.focus();
  }
  const stickToBottom = useRef(true);

  const markRead = useCallback(() => {
    void apiPost(`${base}/read`);
  }, [base]);

  const knownIds = useRef(new Set(initial.map((msg) => msg.id)));
  useEffect(() => {
    for (const msg of messages) knownIds.current.add(msg.id);
  }, [messages]);

  // Poll for new messages and mark incoming ones as read while the thread is open.
  useEffect(() => {
    markRead();
    const timer = setInterval(async () => {
      const result = await apiGet<MessageDTO[]>(`${base}/messages`);
      if (!result.ok) return;
      const incoming = result.data.some((msg) => !msg.fromMe && !knownIds.current.has(msg.id));
      setMessages((current) => mergeById(current, result.data));
      if (incoming) markRead();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [base, markRead]);

  // Keep the newest message in view unless the user scrolled up to read history.
  useEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function loadOlder() {
    const first = messages[0];
    if (!first) return;
    const result = await apiGet<MessageDTO[]>(`${base}/messages?before=${first.id}`);
    if (!result.ok) return;
    stickToBottom.current = false;
    setHasOlder(result.data.length >= 50);
    setMessages((current) => mergeById(result.data, current));
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const result = await apiPost<MessageDTO>(`${base}/messages`, { body });
    setSending(false);
    if (result.ok) {
      setDraft('');
      stickToBottom.current = true;
      setMessages((current) => mergeById(current, [result.data]));
    } else {
      setError(t.fieldErrors[result.fields?.body ?? ''] ?? t.errors[result.code as keyof typeof t.errors] ?? t.errors.INTERNAL);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  const today = todayIn();
  let lastDay = '';
  const lastMine = [...messages].reverse().find((msg) => msg.fromMe);

  return (
    <div className={showPresets ? 'chat-layout chat-layout-aside' : 'chat-layout'}>
      <section className="chat card">
        <p className="chat-privacy">
          <Lock size={14} aria-hidden />
          {privacyNote}
        </p>

        <div className="chat-scroll" ref={scroller} onScroll={onScroll} aria-live="polite">
          {hasOlder && (
            <button type="button" className="btn btn-secondary btn-sm chat-older" onClick={loadOlder}>
              {m.loadOlder}
            </button>
          )}
          {messages.length === 0 && <p className="chat-empty">{m.empty}</p>}
          {messages.map((msg) => {
            const day = todayIn(undefined, new Date(msg.createdAt));
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <Fragment key={msg.id}>
                {showDay && (
                  <div className="chat-day">
                    <span>{day === today ? t.day.today : formatDayLong(day, locale)}</span>
                  </div>
                )}
                <div className="bubble-row" data-mine={msg.fromMe || undefined}>
                  <div className="bubble">
                    <p dir="auto">{msg.body}</p>
                    <span className="bubble-meta">
                      {formatClock(msg.createdAt, locale)}
                      {msg.fromMe && msg.id === lastMine?.id && (
                        <span className="bubble-status" title={msg.read ? m.seen : m.sent}>
                          {msg.read ? <CheckCheck size={14} aria-hidden /> : <Check size={14} aria-hidden />}
                          <span className="visually-hidden">{msg.read ? m.seen : m.sent}</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>

        {showPresets && presetsOpen && (
          <div id="chat-presets" className="chat-presets" role="group" aria-label={m.encourage}>
            {m.presets.map((p) => {
              const Icon = PRESET_ICONS[p.id];
              return (
                <button key={p.id} type="button" className="chat-preset" onClick={() => pickPreset(p.text)}>
                  <Icon size={16} aria-hidden />
                  {p.text}
                </button>
              );
            })}
          </div>
        )}

        {error && <FormAlert>{error}</FormAlert>}
        <form className="chat-composer" onSubmit={send}>
          {showPresets && (
            <button
              type="button"
              className="chat-presets-toggle"
              onClick={() => setPresetsOpen((o) => !o)}
              aria-expanded={presetsOpen}
              aria-controls="chat-presets"
              aria-label={m.encourage}
              title={m.encourage}
            >
              <Sparkles size={20} aria-hidden />
            </button>
          )}
          <label htmlFor="chat-input" className="visually-hidden">
            {m.placeholder}
          </label>
          <textarea
            ref={inputRef}
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={m.placeholder}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={1}
            dir="auto"
            title={m.sendHint}
          />
          <button type="submit" className="btn btn-primary chat-send" disabled={sending || !draft.trim()} aria-label={m.send}>
            {sending ? <span className="spinner" aria-hidden /> : <SendHorizontal size={20} aria-hidden className="rtl-flip" />}
          </button>
        </form>
      </section>
      {showPresets && (
        <aside className="chat-aside card">
          <h2 className="chat-aside-title">
            <Sparkles size={18} aria-hidden />
            {m.encourage}
          </h2>
          <div className="chat-aside-list">
            {m.presets.map((p) => {
              const Icon = PRESET_ICONS[p.id];
              return (
                <button key={p.id} type="button" className="chat-preset" onClick={() => pickPreset(p.text)}>
                  <Icon size={16} aria-hidden />
                  {p.text}
                </button>
              );
            })}
          </div>
          <p className="chat-aside-note">
            <Lock size={14} aria-hidden />
            {privacyNote}
          </p>
        </aside>
      )}
    </div>
  );
}
