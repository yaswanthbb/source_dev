/** Existing sanitizer algorithm with an injectable URL resolver for deterministic evals. */
export async function sanitizeConceptLinks(
  content: string,
  resolve: (url: string) => Promise<boolean>,
  onBatch: (count: number) => void = () => undefined,
  onInvalid: (url: string) => void = () => undefined,
): Promise<string> {
  if (!content) return content;
  const urls = new Set<string>();
  for (const match of content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g))
    urls.add(match[2]);
  if (!urls.size) return content;
  onBatch(urls.size);
  const valid = new Map<string, boolean>();
  await Promise.all(
    [...urls].map(async (url) => {
      const ok = await resolve(url);
      valid.set(url, ok);
      if (!ok) onInvalid(url);
    }),
  );
  return content
    .split('\n')
    .filter((line) =>
      [...line.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)].every(
        (m) => valid.get(m[2]) !== false,
      ),
    )
    .join('\n')
    .replace(
      /##\s+(?:Practice\s*(?:&|and)\s*Further\s*Reading|Further\s*Reading|Practice\s*Resources)\s*(?:\n\s*)*(?=\n##|\s*$)/i,
      '',
    )
    .trim();
}
