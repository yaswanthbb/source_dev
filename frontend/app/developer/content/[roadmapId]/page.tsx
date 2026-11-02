import { RoadmapEditorPage } from "@/components/content/gui-roadmap-editor";

export default async function Page({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { roadmapId } = await params;
  return <RoadmapEditorPage roadmapId={roadmapId} />;
}
