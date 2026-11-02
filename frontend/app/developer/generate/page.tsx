import { GenerationPage } from "@/components/generation/gui-generation";
import { generationRequest } from "@/components/generation/generation-data";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const request = generationRequest(await searchParams);
  return <GenerationPage key={JSON.stringify(request)} request={request} />;
}
