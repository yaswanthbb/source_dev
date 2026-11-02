import { notFound } from "next/navigation";
import { ArticleReaderPage } from "@/components/articles/article-reader-page";
import { loadPublicArticle } from "@/components/articles/article-reader-server";
import { articleReaderHref } from "@/components/articles/article-reader-data";
export const metadata = { title: "Read an article · source:dev" };
export default async function PublicArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadPublicArticle(id);
  if (result.kind === "missing") notFound();
  return (
    <ArticleReaderPage result={result} retryHref={articleReaderHref(id)} />
  );
}
