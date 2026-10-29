import { ArticleEditorPage } from "@/components/articles/gui-article-editor";
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleEditorPage key={id} id={id} />;
}
