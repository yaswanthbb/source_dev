import { RoadmapPage } from "@/components/roadmaps/gui-roadmaps";

export default async function RoadmapOverviewPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return <RoadmapPage reference={reference} />;
}
