import React from "react";

/**
 * Tiny, dependency-free markdown renderer for chatbot answers.
 * Supports paragraphs, **bold**, *italic*, `code`, fenced code blocks,
 * bullet / numbered lists and headings.
 *
 * Output is built from React elements (no dangerouslySetInnerHTML), so
 * model-generated text can never inject HTML or scripts. Links are
 * intentionally not rendered as anchors.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

function renderInline(text, keyPrefix) {
  const nodes = [];
  let last = 0;
  let index = 0;
  let match;

  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^\s*#{1,6}\s+/;
const FENCE = /^\s*```/;

function isSpecialLine(line) {
  return BULLET.test(line) || NUMBERED.test(line) || HEADING.test(line) || FENCE.test(line);
}

function parseBlocks(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (FENCE.test(line)) {
      const code = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (BULLET.test(line)) {
      const items = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(lines[i].replace(BULLET, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (NUMBERED.test(line)) {
      const items = [];
      while (i < lines.length && NUMBERED.test(lines[i])) {
        items.push(lines[i].replace(NUMBERED, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (HEADING.test(line)) {
      blocks.push({ type: "heading", text: line.replace(HEADING, "") });
      i += 1;
      continue;
    }

    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "p", lines: paragraph });
  }

  return blocks;
}

export default function ChatMarkdown({ text }) {
  const blocks = parseBlocks(text);

  return (
    <div className="ov-md">
      {blocks.map((block, blockIndex) => {
        const key = `b${blockIndex}`;

        if (block.type === "code") {
          return (
            <pre key={key}>
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "ul" || block.type === "ol") {
          const List = block.type;
          return (
            <List key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </List>
          );
        }

        if (block.type === "heading") {
          return (
            <p key={key}>
              <strong>{renderInline(block.text, key)}</strong>
            </p>
          );
        }

        return (
          <p key={key}>
            {block.lines.map((line, lineIndex) => (
              <React.Fragment key={`${key}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${key}-${lineIndex}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
