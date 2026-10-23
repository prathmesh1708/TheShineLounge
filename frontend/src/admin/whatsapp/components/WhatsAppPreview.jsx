import React from 'react';
import { ChevronLeft, FileText, ExternalLink, Phone, Reply, MoreVertical, Video as VideoIcon, Phone as CallIcon } from 'lucide-react';
import TSLLogo from '../../../common/components/TSLLogo';
import { formatWhatsAppText, renderVariables } from '../utils/whatsappFormat';

const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

function MediaBlock({ type, url, filename }) {
  if (type === 'image') {
    return url
      ? <img src={url} alt="" className="w-full max-h-64 object-cover rounded-md" />
      : <div className="h-36 rounded-md bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 font-semibold">Image</div>;
  }
  if (type === 'video') {
    return url
      ? <video src={url} controls className="w-full max-h-64 rounded-md bg-black" />
      : <div className="h-36 rounded-md bg-gray-800 flex items-center justify-center text-[11px] text-gray-300 font-semibold">Video</div>;
  }
  if (type === 'document') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-[#f5f6f6] p-2.5">
        <div className="w-8 h-10 rounded bg-rose-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">PDF</div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-gray-800 truncate">{filename || 'Document.pdf'}</p>
          <p className="text-[10px] text-gray-500">PDF document</p>
        </div>
        <FileText className="w-4 h-4 text-gray-400 ml-auto shrink-0" />
      </div>
    );
  }
  return null;
}

function Bubble({ children, wide = false, time = now() }) {
  return (
    <div className={`relative ${wide ? 'max-w-full' : 'max-w-[88%]'} self-start bg-white rounded-lg rounded-tl-none shadow-sm px-2 pt-1.5 pb-1 text-[13px] leading-[1.35] text-[#111b21]`}>
      <span className="absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
      {children}
      <div className="text-right text-[10px] text-gray-400 mt-0.5 select-none">{time}</div>
    </div>
  );
}

/**
 * How the message looks on the recipient's phone. `body` may contain
 * {{variables}}; they are filled from `vars`.
 */
export default function WhatsAppPreview({
  headerType = 'none',
  headerText = '',
  mediaUrl = '',
  mediaFilename = '',
  body = '',
  vars = {},
  footer = '',
  buttons = [],
  recipientLabel = '',
  className = ''
}) {
  const text = renderVariables(body, vars).trim();
  const isAudio = headerType === 'audio';
  const hasMedia = ['image', 'video', 'document'].includes(headerType);
  const empty = !text && !hasMedia && !isAudio && headerType !== 'text';

  return (
    <div className={`mx-auto w-full max-w-[320px] ${className}`}>
      <div className="rounded-[2rem] border-[6px] border-gray-900 bg-gray-900 shadow-xl overflow-hidden">
        {/* Chat header */}
        <div className="bg-[#008069] text-white px-2.5 py-2 flex items-center gap-2">
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            <TSLLogo className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight truncate">The Shine Lounge</p>
            <p className="text-[10px] text-white/75 leading-tight truncate">
              {recipientLabel ? `Preview for ${recipientLabel}` : 'Business account'}
            </p>
          </div>
          <VideoIcon className="w-4 h-4 opacity-90" />
          <CallIcon className="w-3.5 h-3.5 opacity-90" />
          <MoreVertical className="w-4 h-4 opacity-90" />
        </div>

        {/* Chat body */}
        <div className="bg-[#efeae2] min-h-[360px] max-h-[520px] overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
          <div className="self-center text-[10px] bg-white/80 text-gray-500 px-2 py-0.5 rounded-md shadow-sm mb-1">TODAY</div>

          {empty && (
            <div className="self-center mt-16 text-[11px] text-gray-500 text-center px-6">
              Start typing a message to see the preview here.
            </div>
          )}

          {isAudio && (
            <Bubble>
              {mediaUrl
                ? <audio src={mediaUrl} controls className="w-[230px] h-10" />
                : <div className="w-[220px] h-9 rounded bg-gray-100 flex items-center justify-center text-[11px] text-gray-500 font-semibold">Voice / audio message</div>}
            </Bubble>
          )}

          {(text || hasMedia || headerType === 'text') && (
            <div className="flex flex-col gap-1 max-w-[88%] self-start">
              <Bubble wide>
                {hasMedia && <div className="mb-1 -mx-1 -mt-0.5"><MediaBlock type={headerType} url={mediaUrl} filename={mediaFilename} /></div>}
                {headerType === 'text' && headerText && (
                  <p className="font-bold text-[13.5px] mb-1">{headerText}</p>
                )}
                {text && <div className="whitespace-pre-wrap break-words">{formatWhatsAppText(text)}</div>}
                {footer && <p className="text-[11px] text-gray-500 mt-1">{footer}</p>}
              </Bubble>
              {buttons.filter((b) => b && b.text).map((b, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm py-2 text-center text-[13px] font-medium text-[#027eb5] flex items-center justify-center gap-1.5">
                  {b.type === 'URL' && <ExternalLink className="w-3.5 h-3.5" />}
                  {b.type === 'PHONE_NUMBER' && <Phone className="w-3.5 h-3.5" />}
                  {b.type === 'QUICK_REPLY' && <Reply className="w-3.5 h-3.5" />}
                  {b.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input bar (decorative) */}
        <div className="bg-[#f0f2f5] px-2 py-2 flex items-center gap-2">
          <div className="flex-1 h-8 rounded-full bg-white text-[11px] text-gray-400 flex items-center px-3">Message</div>
          <div className="w-8 h-8 rounded-full bg-[#008069]" />
        </div>
      </div>
    </div>
  );
}
