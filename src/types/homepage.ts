// Homepage Builder Types

export type SectionType =
  | 'hero_banner'
  | 'featured_products'
  | 'category_grid'
  | 'product_by_attribute'
  | 'statistics'
  | 'branches'
  | 'custom_content';

export type DisplayMode = 'slider' | 'grid' | 'single' | 'list';

export interface LocalizedText {
  en?: string;
  ka?: string;
  [key: string]: string | undefined;
}

export interface ListItem {
  id: number;
  label: LocalizedText;
  custom_id?: string;
  position: number;
  is_active: boolean;
  custom_data: Record<string, any>;
  children: ListItem[];
}

export interface SectionSettings {
  columns?: number;
  autoSlide?: boolean;
  slideInterval?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showViewAll?: boolean;
  viewAllLink?: string;
  maxItems?: number;
  [key: string]: any;
}

export interface HomepageSection {
  id: number;
  title: LocalizedText;
  subtitle?: LocalizedText;
  section_type: SectionType;
  position: number;
  display_mode: DisplayMode;
  settings: SectionSettings;
  background_color?: string;
  background_image_url?: string;
  text_color?: string;
  attribute_key?: string;
  attribute_value?: string;
  data: ListItem[];
}

export interface HomepageSectionProps {
  section: HomepageSection;
  language: string;
}
