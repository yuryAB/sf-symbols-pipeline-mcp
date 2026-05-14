export function heading(title: string, level = 1): string {
  return `${"#".repeat(level)} ${title}`;
}

export function bulletList(items: string[]): string {
  return items.length === 0
    ? "- None"
    : items.map((item) => `- ${item}`).join("\n");
}

export function fencedJson(value: unknown): string {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

export function reportMarkdown(
  title: string,
  summary: string,
  sections: Array<{ title: string; body: string }>,
): string {
  const parts = [heading(title), "", summary.trim()];

  for (const section of sections) {
    parts.push("", heading(section.title, 2), "", section.body.trim());
  }

  return `${parts.join("\n")}\n`;
}
