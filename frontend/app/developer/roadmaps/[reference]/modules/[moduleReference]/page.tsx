import { RoadmapPage } from "@/components/roadmaps/gui-roadmaps";

export default async function Page({
  params,
}: {
  params: Promise<{ reference: string; moduleReference: string }>;
}) {
  const { reference, moduleReference } = await params;
  return (
    <RoadmapPage reference={reference} moduleReference={moduleReference} />
  );
}
