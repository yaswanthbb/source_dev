import type { Metadata } from "next";
import { ArticlesPage } from "@/components/articles/articles-page";
import { articlesRequest } from "@/components/articles/articles-data";
import { loadPublicArticles } from "@/components/articles/articles-server";
export const metadata: Metadata = {
  title: "Articles | source:dev",
  description:
    "Handwritten developer articles. Read explanations, lessons and ideas without an account.",
};
export default async function PublicArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const request = articlesRequest(await searchParams);
  return <ArticlesPage result={await loadPublicArticles(request)} />;
}
