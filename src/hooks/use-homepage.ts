import { useQuery } from "@tanstack/react-query";
import { ecommerceClientHomepageList } from "@/api/generated/api";
import type { HomepageSection } from "@/types/homepage";

// Fetch homepage sections from API
async function fetchHomepageSections(): Promise<HomepageSection[]> {
  const response = await ecommerceClientHomepageList();
  // The generated function returns the raw response
  // API returns { sections: [...] } or array directly depending on backend version
  if (Array.isArray(response)) {
    return response as unknown as HomepageSection[];
  }
  // Handle wrapped response
  const wrappedResponse = response as unknown as { sections: HomepageSection[] };
  return wrappedResponse.sections || [];
}

// Hook for fetching homepage configuration
export function useHomepageSections() {
  return useQuery({
    queryKey: ["homepageSections"],
    queryFn: fetchHomepageSections,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
