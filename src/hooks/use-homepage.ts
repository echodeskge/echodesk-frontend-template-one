import { useQuery } from "@tanstack/react-query";
import axios from "@/api/axios";
import type { HomepageSection } from "@/types/homepage";

// API response wrapper
interface HomepageResponse {
  sections: HomepageSection[];
}

// Fetch homepage sections from API
async function fetchHomepageSections(): Promise<HomepageSection[]> {
  const response = await axios.get<HomepageResponse>("/api/ecommerce/client/homepage/");
  // API returns { sections: [...] }, extract the array
  return response.data.sections || [];
}

// Hook for fetching homepage configuration
export function useHomepageSections() {
  return useQuery({
    queryKey: ["homepageSections"],
    queryFn: fetchHomepageSections,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
