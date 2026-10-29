import { ArticlesPage } from "@/components/articles/articles-page";
export default function Loading() {
  return (
    <ArticlesPage
      result={{ kind: "loading", request: { search: "", page: 1 } }}
    />
  );
}
