import { EditLessonPage } from "@/components/content/gui-edit-lesson";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditLessonPage key={id} id={id} />;
}
