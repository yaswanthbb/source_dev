"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useRoadmapProgress } from "@/lib/hooks/use-roadmap-progress";
import { GuiWorkspaceShell } from "@/components/gui/gui-workspace-shell";
import { DashboardView, RoadmapCard } from "./dashboard-view";
import type {
  ActivityDay,
  Badge,
  ConceptProgress,
  Gamification,
  Resource,
  ReviewCount,
  Roadmap,
  User,
} from "./dashboard-data";

export function resource<T>(query: UseQueryResult<T>): Resource<T> {
  return {
    data: query.data,
    pending: query.isPending,
    error: query.isError,
    refreshing: query.isFetching,
    retry: () => {
      void query.refetch();
    },
  };
}

function useDashboardQuery<T>(key: readonly unknown[], path: string) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async ({ signal }) =>
      (await apiClient.get<T>(path, { signal, timeout: 12000 })).data,
    retry: 1,
  });
}
function ConnectedRoadmapCard({ roadmap }: { roadmap: Roadmap }) {
  // Fetch only the four displayed cards, reuse the shared progress cache, expose failures.
  const progress = useRoadmapProgress(roadmap.id);
  return <RoadmapCard roadmap={roadmap} progress={resource(progress)} />;
}

export function GuiDeveloperDashboard() {
  const user = useDashboardQuery<User>(["users", "me"], "/users/me");
  const gamification = useDashboardQuery<Gamification>(
    ["gamification", "me"],
    "/gamification/me",
  );
  const progress = useDashboardQuery<ConceptProgress[]>(
    ["progress", "me"],
    "/progress/me",
  );
  const activity = useDashboardQuery<ActivityDay[]>(
    ["gamification", "activity", 365],
    "/gamification/activity?days=365",
  );
  const roadmaps = useDashboardQuery<Roadmap[]>(["roadmaps"], "/roadmaps");
  const badges = useDashboardQuery<Badge[]>(["badges"], "/badges");
  const review = useDashboardQuery<ReviewCount>(
    ["review", "due-count"],
    "/review/due-count",
  );
  return (
    <GuiWorkspaceShell user={user.data}>
      <DashboardView
        user={resource(user)}
        gamification={resource(gamification)}
        progress={resource(progress)}
        activity={resource(activity)}
        roadmaps={resource(roadmaps)}
        badges={resource(badges)}
        review={resource(review)}
        renderRoadmap={(roadmap) => (
          <ConnectedRoadmapCard key={roadmap.id} roadmap={roadmap} />
        )}
      />
    </GuiWorkspaceShell>
  );
}
