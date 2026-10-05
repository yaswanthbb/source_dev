import Link from 'next/link';

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  author?: { name?: string } | null;
  createdAt: string;
}

async function getArticles(search?: string): Promise<ArticleRow[]> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  try {
    const res = await fetch(`${base}/articles${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()) as ArticleRow[];
  } catch {
    return [];
  }
}

export default async function PublicArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const articles = await getArticles(params.search);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e6edf3] font-mono">
      <header className="border-b border-[#21262d] px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight">
          <span className="text-[#3fb950]">■ </span>source:dev
        </Link>
        <nav className="flex items-center gap-3 text-[12px]">
          <Link href="/developer/dashboard" className="text-[#8b949e] hover:text-[#e6edf3]">
            APP
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg bg-[#3fb950] text-[#0a0e14] font-bold"
          >
            SIGN IN
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <p className="text-[11px] tracking-widest text-[#8b949e]">┌─[ articles :: hand-written ]</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Notes from developers</h1>
          <p className="text-[13px] text-[#8b949e] mt-1">
            {'// public discovery funnel — full articles, no login required'}
          </p>
        </div>

        <form method="GET" className="flex gap-2">
          <input
            name="search"
            defaultValue={params.search ?? ''}
            placeholder="filter by title..."
            className="flex-1 px-3 py-2 rounded-lg text-[13px] bg-[#161b22] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-[12px] font-bold bg-[#3fb950] text-[#0a0e14]"
          >
            FILTER
          </button>
        </form>

        {articles.length === 0 ? (
          <p className="text-[13px] text-[#8b949e]">No articles yet — be the first to write one.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-[#161b22] transition-colors"
              >
                <span className="font-bold text-[14px] truncate">{a.title}</span>
                <span className="text-[11px] text-[#8b949e] shrink-0">
                  {a.author?.name ?? 'anon'} · {a.createdAt.slice(0, 10)}
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="text-[12px] text-[#8b949e]">
          Developers: <Link href="/developer/articles/new" className="text-[#3fb950] font-bold">write one ➔</Link>
        </p>
      </main>
    </div>
  );
}
