import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ArticleDetail {
  id: string;
  title: string;
  content: string;
  author?: { id?: string; name?: string } | null;
  authorId?: string | null;
  roadmapId?: string | null;
  conceptId?: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getArticle(id: string): Promise<ArticleDetail | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${base}/articles/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as ArticleDetail;
  } catch {
    return null;
  }
}

export default async function PublicArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e6edf3] font-mono">
      <header className="border-b border-[#21262d] px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight">
          <span className="text-[#3fb950]">■ </span>source:dev
        </Link>
        <nav className="flex items-center gap-3 text-[12px]">
          <Link href="/articles" className="text-[#8b949e] hover:text-[#e6edf3]">
            ALL ARTICLES
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg bg-[#3fb950] text-[#0a0e14] font-bold"
          >
            SIGN IN
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-5">
        <div>
          <p className="text-[11px] tracking-widest text-[#8b949e]">
            ┌─[ article :: {article.createdAt.slice(0, 10)} ]
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{article.title}</h1>
          <p className="text-[12px] text-[#8b949e] mt-1">
            by {article.author?.name ?? 'anon'}
            {article.updatedAt !== article.createdAt ? ' · (edited)' : ''}
          </p>
        </div>

        <article className="text-[14px] leading-relaxed whitespace-pre-wrap">
          {article.content}
        </article>

        {(article.roadmapId || article.conceptId) && (
          <div className="rounded-xl border border-[#30363d] p-4 space-y-1">
            <p className="text-[11px] font-bold tracking-widest text-[#8b949e]">
              FURTHER READING
            </p>
            <p className="text-[12px] text-[#8b949e]">
              Linked curriculum requires an account:{' '}
              <Link href="/login" className="text-[#3fb950] font-bold">
                sign in to open ➔
              </Link>
            </p>
          </div>
        )}

        <p className="text-[12px] text-[#8b949e] pt-4 border-t border-[#21262d]">
          Like this? <Link href="/register" className="text-[#3fb950] font-bold">Join source:dev</Link> — every
          account is a developer account.
        </p>
      </main>
    </div>
  );
}
