import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface ConceptProgressInfo {
  conceptId: string;
  conceptTitle: string;
  conceptSlug?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
  prerequisites?: Array<{
    prerequisiteConceptId: string;
    title: string;
    slug?: string;
    isCompletedByCurrentUser: boolean;
  }>;
}

export interface RoadmapProgressData {
  roadmapId: string;
  roadmapTitle?: string;
  title?: string;
  totalConcepts: number;
  completedConcepts?: number;
  completedConceptsCount?: number;
  percentage?: number;
  completionPercentage?: number;
  concepts?: ConceptProgressInfo[];
}

export interface ModuleConceptItem {
  id: string;
  moduleId: string;
  conceptId: string;
  orderIndex: number;
  concept: {
    id: string;
    title: string;
    slug?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    body?: string;
  };
}

export interface RoadmapModuleItem {
  id: string;
  roadmapId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  moduleConcepts?: ModuleConceptItem[];
}

export interface RoadmapDetailData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  modules?: RoadmapModuleItem[];
}

// Hook for fetching a single roadmap's user progress
export function useRoadmapProgress(roadmapId: string | undefined) {
  return useQuery<RoadmapProgressData>({
    queryKey: ['roadmaps', roadmapId, 'progress'],
    queryFn: async () => {
      if (!roadmapId) throw new Error('Roadmap ID required');
      const response = await apiClient.get<RoadmapProgressData>(
        `/roadmaps/${roadmapId}/progress`,
      );
      const data = response.data;
      return {
        ...data,
        completedConceptsCount:
          data.completedConceptsCount ?? data.completedConcepts ?? 0,
        completionPercentage:
          data.completionPercentage ?? data.percentage ?? 0,
      };
    },
    enabled: Boolean(roadmapId),
  });
}

// Hook for fetching full roadmap structure by ID
export function useRoadmapDetail(roadmapId: string | undefined) {
  return useQuery<RoadmapDetailData>({
    queryKey: ['roadmaps', roadmapId, 'detail'],
    queryFn: async () => {
      if (!roadmapId) throw new Error('Roadmap ID required');
      const response = await apiClient.get<RoadmapDetailData>(
        `/roadmaps/${roadmapId}`,
      );
      return response.data;
    },
    enabled: Boolean(roadmapId),
  });
}

// Hook for fetching progress across all roadmaps in bulk
export function useAllRoadmapsProgress(roadmapIds: string[]) {
  return useQuery<Record<string, RoadmapProgressData>>({
    queryKey: ['roadmaps', 'all-progress', roadmapIds],
    queryFn: async () => {
      const entries = await Promise.all(
        roadmapIds.map(async (id) => {
          try {
            const res = await apiClient.get<RoadmapProgressData>(
              `/roadmaps/${id}/progress`,
            );
            const data = res.data;
            return [
              id,
              {
                ...data,
                completedConceptsCount:
                  data.completedConceptsCount ?? data.completedConcepts ?? 0,
                completionPercentage:
                  data.completionPercentage ?? data.percentage ?? 0,
              },
            ] as const;
          } catch {
            return [
              id,
              {
                roadmapId: id,
                totalConcepts: 0,
                completedConceptsCount: 0,
                completionPercentage: 0,
                concepts: [],
              },
            ] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: roadmapIds.length > 0,
  });
}
