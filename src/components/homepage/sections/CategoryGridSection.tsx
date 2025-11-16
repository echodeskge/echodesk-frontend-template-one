"use client";

import Link from "next/link";
import Image from "next/image";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function CategoryGridSection({ section, language }: HomepageSectionProps) {
  const items = section.data || [];
  const settings = section.settings || {};
  const columns = settings.columns || 3;

  const getLocalizedText = (text: LocalizedText | string | undefined): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[language] || text.en || text.ka || Object.values(text)[0] || "";
  };

  // Helper to get localized value from custom_data with _en/_ka suffix
  const getCustomDataText = (customData: Record<string, any>, key: string): string => {
    const langKey = `${key}_${language}`;
    const enKey = `${key}_en`;
    const kaKey = `${key}_ka`;
    return customData[langKey] || customData[enKey] || customData[kaKey] || customData[key] || "";
  };

  const sectionStyle = {
    backgroundColor: section.background_color || undefined,
    backgroundImage: section.background_image_url
      ? `url(${section.background_image_url})`
      : undefined,
    color: section.text_color || undefined,
  };

  if (items.length === 0) {
    return null;
  }

  // Check if this is a custom layout with specific widths (like Shop by Room)
  const hasCustomLayout = items.some((item) => item.custom_data?.width);

  if (hasCustomLayout) {
    // Custom flexible layout based on width specifications
    return (
      <section className="py-16" style={sectionStyle}>
        <div className="container">
          {section.title && (
            <h2 className="text-3xl font-bold">{getLocalizedText(section.title)}</h2>
          )}
          {section.subtitle && (
            <p className="mt-2 text-muted-foreground">
              {getLocalizedText(section.subtitle)}
            </p>
          )}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[340px]">
            {items.map((item) => {
              const customData = item.custom_data || {};
              const categoryName = getCustomDataText(customData, "name") || getLocalizedText(item.label);
              const link = customData.link || `/products?attr_category=${encodeURIComponent(categoryName)}`;
              const image = customData.image;
              const productCount = customData.product_count;
              const hoverText = getCustomDataText(customData, "hover_text");
              const description = getCustomDataText(customData, "description");
              const gradientStyle = customData.gradient_style;

              // Calculate column span based on width (out of ~1260px total)
              const width = customData.width || 400;
              const colSpan = width > 450 ? "md:col-span-6" : width > 350 ? "md:col-span-4" : "md:col-span-3";

              return (
                <Link
                  key={item.id}
                  href={link}
                  className={`group relative overflow-hidden rounded-2xl transition-all hover:shadow-xl ${colSpan}`}
                  style={{
                    background: gradientStyle || "linear-gradient(135deg, rgba(200, 200, 200, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)",
                  }}
                >
                  {image && (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <Image
                        src={image}
                        alt={categoryName}
                        width={customData.width || 400}
                        height={customData.height || 300}
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-xl font-semibold text-white">
                      {categoryName}
                    </h3>
                    {description && (
                      <p className="text-sm text-white/80 mt-1">{description}</p>
                    )}
                    {productCount && (
                      <p className="text-sm text-white/70 mt-1">
                        {productCount} {language === "ka" ? "პროდუქტი" : "products"}
                      </p>
                    )}
                  </div>
                  {hoverText && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">{hoverText}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Standard grid layout
  const gridCols = {
    2: "md:grid-cols-2 lg:grid-cols-2",
    3: "md:grid-cols-3 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  }[columns] || "md:grid-cols-3 lg:grid-cols-3";

  return (
    <section className="py-16" style={sectionStyle}>
      <div className="container">
        {section.title && (
          <h2 className="text-3xl font-bold">{getLocalizedText(section.title)}</h2>
        )}
        {section.subtitle && (
          <p className="mt-2 text-muted-foreground">
            {getLocalizedText(section.subtitle)}
          </p>
        )}
        <div className={`mt-8 grid grid-cols-2 gap-4 ${gridCols}`}>
          {items.map((item) => {
            const customData = item.custom_data || {};
            const categoryName = getCustomDataText(customData, "name") || getLocalizedText(item.label);
            const link = customData.link || `/products?attr_category=${encodeURIComponent(categoryName)}`;
            const image = customData.image;
            const productCount = customData.product_count;
            const description = getCustomDataText(customData, "description");
            const gradientStyle = customData.gradient_style;

            return (
              <Link
                key={item.id}
                href={link}
                className="group relative aspect-square overflow-hidden rounded-lg p-6 transition-all hover:shadow-lg"
                style={{
                  background: gradientStyle || "linear-gradient(135deg, rgba(var(--primary), 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)",
                }}
              >
                {image && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Image
                      src={image}
                      alt={categoryName}
                      width={200}
                      height={200}
                      className="object-contain transition-transform group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-semibold text-white">
                    {categoryName}
                  </h3>
                  {description && (
                    <p className="text-sm text-white/80">{description}</p>
                  )}
                  {productCount && (
                    <p className="text-sm text-white/70">
                      {productCount} {language === "ka" ? "პროდუქტი" : "products"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
