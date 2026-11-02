import { ArticleReaderPage } from "@/components/articles/article-reader-page";
export default function MissingArticle() {
  return <ArticleReaderPage result={{ kind: "missing" }} />;
}
