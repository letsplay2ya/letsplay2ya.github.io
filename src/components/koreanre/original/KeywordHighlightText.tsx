import { Chip } from './UiPrimitives';

interface KeywordHighlightTextProps {
  text?: string | null;
}

const KEYWORD_PATTERN = /\^\^([\s\S]+?)\^\^/g;

export function KeywordHighlightText({ text }: KeywordHighlightTextProps) {
  if (!text) return null;

  const normalizedText = text.replace(/\\r\\n|\\n|\\r/g, '\n').replace(/\r\n?/g, '\n');
  const parts: Array<{ type: 'text' | 'keyword'; value: string }> = [];
  let cursor = 0;

  for (const match of normalizedText.matchAll(KEYWORD_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const matchedText = match[0] ?? '';
    const keyword = match[1] ?? '';

    if (matchIndex > cursor) {
      parts.push({ type: 'text', value: normalizedText.slice(cursor, matchIndex) });
    }

    parts.push({ type: 'keyword', value: keyword });
    cursor = matchIndex + matchedText.length;
  }

  if (cursor < normalizedText.length) {
    parts.push({ type: 'text', value: normalizedText.slice(cursor) });
  }

  return (
    <span className="max-w-full whitespace-pre-wrap [overflow-wrap:anywhere]">
      {parts.map((part, index) =>
        part.type === 'keyword' ? (
          <Chip
            key={index}
            variant="tint"
            color="green"
            className="inline! max-w-full min-h-0! whitespace-normal! [overflow-wrap:anywhere] p-0! text-left"
          >
            {part.value}
          </Chip>
        ) : (
          part.value
        ),
      )}
    </span>
  );
}
