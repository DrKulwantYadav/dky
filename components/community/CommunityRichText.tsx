import type { ReactNode } from "react";

// Small Markdown subset; content is always rendered as React text, never injected as HTML.
export default function CommunityRichText({ value }: { value: string }) {
  const blocks = value.trim().split(/\n\s*\n/).filter(Boolean);
  return <div className="community-richtext">{blocks.map((block, index) => {
    if (block.startsWith("## ")) return <h3 key={index}>{inline(block.slice(3))}</h3>;
    if (block.startsWith("- ")) return <ul key={index}>{block.split("\n").filter(x => x.startsWith("- ")).map((line, i) => <li key={i}>{inline(line.slice(2))}</li>)}</ul>;
    return <p key={index}>{block.split("\n").map((line, i) => <span key={i}>{i > 0 && <br/>}{inline(line)}</span>)}</p>;
  })}</div>;
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^)]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    return part;
  });
}
