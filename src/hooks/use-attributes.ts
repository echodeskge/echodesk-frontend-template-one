import { useQuery } from "@tanstack/react-query";
import {
  ecommerceClientAttributesList,
  ecommerceClientAttributesRetrieve,
} from "@/api/generated";

export function useAttributes(filters?: {
  isVariantAttribute?: boolean;
  ordering?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["attributes", filters],
    queryFn: () =>
      ecommerceClientAttributesList(
        undefined, // attributeType
        filters?.isVariantAttribute,
        filters?.ordering,
        filters?.page
      ),
  });
}

export function useFilterableAttributes() {
  const query = useQuery({
    queryKey: ["attributes", "all"],
    queryFn: () => ecommerceClientAttributesList(),
  });

  // Filter client-side for filterable attributes
  const filterableAttributes = query.data?.results?.filter(
    (attr) => attr.is_filterable
  );

  return {
    ...query,
    data: filterableAttributes,
  };
}

export function useAttribute(id: number) {
  return useQuery({
    queryKey: ["attribute", id],
    queryFn: () => ecommerceClientAttributesRetrieve(id),
    enabled: !!id,
  });
}

// Helper to get category attribute options
export function useCategoryOptions() {
  const { data: filterableAttributes } = useFilterableAttributes();

  const categoryAttribute = filterableAttributes?.find(
    (attr) => attr.key === "category"
  );

  return {
    attribute: categoryAttribute,
    options: categoryAttribute?.options || [],
  };
}
