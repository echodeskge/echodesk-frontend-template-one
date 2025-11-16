"use client";

import Link from "next/link";
import Image from "next/image";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function CategoryGridSection({ section, language }: HomepageSectionProps) {
  const items = section.data || [];
  const settings = section.settings || {};
  const columns = settings.columns || 6;

  const getLocalizedText = (text: LocalizedText | string | undefined): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[language] || text.en || text.ka || Object.values(text)[0] || "";
  };

  const sectionStyle = {
    backgroundColor: section.background_color || undefined,
    backgroundImage: section.background_image_url
      ? `url(${section.background_image_url})`
      : undefined,
    color: section.text_color || undefined,
  };

  const gridCols = {
    2: "md:grid-cols-2 lg:grid-cols-2",
    3: "md:grid-cols-3 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  }[columns] || "md:grid-cols-3 lg:grid-cols-6";

  if (items.length === 0) {
    return null;
  }

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
            const categoryName = getLocalizedText(item.label);
            const link = customData.link || `/products?attr_category=${encodeURIComponent(categoryName)}`;
            const image = customData.image;
            const itemCount = customData.items_count;

            return (
              <Link
                key={item.id}
                href={link}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-6 transition-all hover:from-primary/30 hover:shadow-lg"
              >
                {image ? (
                  <Image
                    src={image}
                    alt={categoryName}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-semibold text-white">
                    {categoryName}
                  </h3>
                  {itemCount && (
                    <p className="text-sm text-white/80">
                      {itemCount} {language === "ka" ? "ნივთი" : "items"}
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
