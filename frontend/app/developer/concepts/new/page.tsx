import { NewLessonPage } from "@/components/content/gui-new-lesson";
import { lessonTargetRequest } from "@/components/content/new-lesson-data";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const request = lessonTargetRequest(query);
  return <NewLessonPage key={JSON.stringify(request)} request={request} />;
}
