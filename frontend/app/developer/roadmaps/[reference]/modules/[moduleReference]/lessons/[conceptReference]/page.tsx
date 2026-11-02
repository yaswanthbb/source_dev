import { RoadmapPage } from "@/components/roadmaps/gui-roadmaps";

export default async function Page({
  params,
}: {
  params: Promise<{
    reference: string;
    moduleReference: string;
    conceptReference: string;
  }>;
}) {
  const { reference, moduleReference, conceptReference } = await params;
  return (
    <RoadmapPage
      reference={reference}
      moduleReference={moduleReference}
      conceptReference={conceptReference}
    />
  );
}
