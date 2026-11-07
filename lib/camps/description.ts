export type CampDescriptionBlock =
  | { type: "paragraph"; text: string }
  | { type: "highlight"; text: string }
  | { type: "list"; items: string[] };

const legacyServicesHeading = /\s*Free Services\s*&\s*Screenings Offered:\s*/i;

export function parseCampDescription(description: string): CampDescriptionBlock[] {
  const legacyMatch = legacyServicesHeading.exec(description);
  const hasExplicitFormatting = description.split(/\r?\n/).some(line => /^(?:! |- )/.test(line.trim()));
  if (legacyMatch && !hasExplicitFormatting) {
    const intro = description.slice(0, legacyMatch.index).trim();
    const services = description.slice(legacyMatch.index + legacyMatch[0].length)
      .trim().replace(/[.:]\s*$/, "")
      .split(/,\s*|\s+and\s+/i).map(item => item.trim()).filter(Boolean);
    return [
      ...(intro ? [{ type: "highlight" as const, text: intro }] : []),
      { type: "paragraph", text: "Free services & screenings offered" },
      ...(services.length ? [{ type: "list" as const, items: services }] : []),
    ];
  }

  const blocks: CampDescriptionBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", items: list });
    list = [];
  };

  for (const sourceLine of description.replace(/\r\n?/g, "\n").split("\n")) {
    const line = sourceLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
    } else if (line.startsWith("! ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "highlight", text: line.slice(2).trim() });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}
