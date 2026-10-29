import { ArticleReaderPage } from "@/components/articles/article-reader-page";
export default function LoadingArticle() {
  return <ArticleReaderPage result={{ kind: "loading" }} />;
}
