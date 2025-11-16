"use client";

import type { HomepageSection as HomepageSectionType } from "@/types/homepage";
import { HeroBannerSection } from "./sections/HeroBannerSection";
import { FeaturedProductsSection } from "./sections/FeaturedProductsSection";
import { CategoryGridSection } from "./sections/CategoryGridSection";
import { ProductByAttributeSection } from "./sections/ProductByAttributeSection";
import { StatisticsSection } from "./sections/StatisticsSection";
import { BranchesSection } from "./sections/BranchesSection";
import { CustomContentSection } from "./sections/CustomContentSection";

interface Props {
  section: HomepageSectionType;
  language: string;
}

export function HomepageSection({ section, language }: Props) {
  switch (section.section_type) {
    case "hero_banner":
      return <HeroBannerSection section={section} language={language} />;

    case "featured_products":
      return <FeaturedProductsSection section={section} language={language} />;

    case "category_grid":
      return <CategoryGridSection section={section} language={language} />;

    case "product_by_attribute":
      return <ProductByAttributeSection section={section} language={language} />;

    case "statistics":
      return <StatisticsSection section={section} language={language} />;

    case "branches":
      return <BranchesSection section={section} language={language} />;

    case "custom_content":
      return <CustomContentSection section={section} language={language} />;

    default:
      // Unknown section type - render nothing
      console.warn(`Unknown section type: ${section.section_type}`);
      return null;
  }
}
