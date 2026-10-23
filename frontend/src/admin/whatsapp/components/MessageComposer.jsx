import React, { useRef, useState } from 'react';
import { Bold, Italic, Strikethrough, Code, Smile, Braces } from 'lucide-react';
import { VARIABLES } from '../utils/whatsappFormat';

const EMOJIS = ['😊', '🙏', '👋', '🎉', '✨', '🚗', '🚙', '🧽', '💦', '🐶', '☕', '✂️', '💈', '🎁', '🔥', '⏰', '📍', '✅', '❤️', '👍', '💯', '📞', '🗓️', '💳'];

/**
 * WhatsApp message editor: formatting toolbar (wraps the selection in the
 * WhatsApp markers), {{variable}} chips, emoji and a character counter.
 */
export default function MessageComposer({ value, onChange, maxLength = 1024, rows = 8, placeholder = 'Type your message…', allowVariables = true }) {
  const ref = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const replaceSelection = (build) => {
    const el = ref.current;
    const text = value || '';
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    const { insert, cursorStart, cursorEnd } = build(text.slice(start, end));
    const next = text.slice(0, start) + insert + text.slice(end);
    onChange(next.slice(0, maxLength));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + cursorStart, start + cursorEnd);
    });
  };

  const wrap = (marker) => replaceSelection((sel) => {
    const inner = sel || 'text';
    return { insert: `${marker}${inner}${marker}`, cursorStart: marker.length, cursorEnd: marker.length + inner.length };
  });

  const insert = (str) => replaceSelection(() => ({ insert: str, cursorStart: str.length, cursorEnd: str.length }));

  const tools = [
    { icon: Bold, title: 'Bold (*text*)', run: () => wrap('*') },
    { icon: Italic, title: 'Italic (_text_)', run: () => wrap('_') },
    { icon: Strikethrough, title: 'Strikethrough (~text~)', run: () => wrap('~') },
    { icon: Code, title: 'Monospace (```text```)', run: () => wrap('```') }
  ];

  const length = (value || '').length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:border-emerald-300">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 relative">
        {tools.map(({ icon: Icon, title, run }) => (
          <button key={title} type="button" title={title} onClick={run}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100">
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" title="Emoji" onClick={() => setShowEmoji((s) => !s)}
          className={`p-1.5 rounded-md hover:bg-gray-100 ${showEmoji ? 'text-amber-500' : 'text-gray-500'}`}>
          <Smile className="w-3.5 h-3.5" />
        </button>
        <span className={`ml-auto text-[10px] font-bold ${length > maxLength * 0.9 ? 'text-rose-500' : 'text-gray-400'}`}>
          {length}/{maxLength}
        </span>
        {showEmoji && (
          <div className="absolute z-20 top-full left-2 mt-1 p-2 bg-white rounded-xl border border-gray-200 shadow-lg grid grid-cols-8 gap-1 w-64">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => { insert(e); setShowEmoji(false); }}
                className="text-lg leading-none p-1 rounded hover:bg-gray-100">{e}</button>
            ))}
          </div>
        )}
      </div>

      <textarea
        ref={ref}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm font-medium text-gray-800 bg-transparent resize-y focus:outline-none"
      />

      {allowVariables && (
        <div className="px-2.5 py-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wide text-gray-400 flex items-center gap-1 mr-0.5">
            <Braces className="w-3 h-3" /> Insert
          </span>
          {VARIABLES.map((v) => (
            <button key={v.key} type="button" onClick={() => insert(`{{${v.key}}}`)} title={`Inserts {{${v.key}}}`}
              className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[10.5px] font-bold text-emerald-700 hover:bg-emerald-100">
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
