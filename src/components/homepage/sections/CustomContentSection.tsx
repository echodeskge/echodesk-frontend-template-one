"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { HomepageSectionProps, LocalizedText, ListItem } from "@/types/homepage";

export function CustomContentSection({ section, language }: HomepageSectionProps) {
  const items = section.data || [];
  const settings = section.settings || {};
  const columns = settings.columns || 3;
  const displayMode = section.display_mode || "grid";

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

  if (items.length === 0) {
    return null;
  }

  // Single item mode - full width content block
  if (displayMode === "single" && items.length > 0) {
    const item = items[0];
    const customData = item.custom_data || {};

    return (
      <section className="py-16" style={sectionStyle}>
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            {customData.image && (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={customData.image}
                  alt={getLocalizedText(item.label)}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              {section.title && (
                <h2 className="text-3xl font-bold mb-4">
                  {getLocalizedText(section.title)}
                </h2>
              )}
              <h3 className="text-2xl font-semibold mb-4">
                {getLocalizedText(item.label)}
              </h3>
              {customData.description && (
                <div
                  className="text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: getLocalizedText(customData.description),
                  }}
                />
              )}
              {customData.link && customData.link_text && (
                <Button className="mt-6" asChild>
                  <Link href={customData.link}>
                    {getLocalizedText(customData.link_text)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // List mode - vertical layout
  if (displayMode === "list") {
    return (
      <section className="py-16" style={sectionStyle}>
        <div className="container">
          {section.title && (
            <h2 className="text-3xl font-bold mb-2">
              {getLocalizedText(section.title)}
            </h2>
          )}
          {section.subtitle && (
            <p className="text-muted-foreground mb-8">
              {getLocalizedText(section.subtitle)}
            </p>
          )}
          <div className="space-y-6">
            {items.map((item) => (
              <ContentListItem
                key={item.id}
                item={item}
                language={language}
                getLocalizedText={getLocalizedText}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Grid mode - default
  const gridCols = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  }[columns] || "lg:grid-cols-3";

  return (
    <section className="py-16" style={sectionStyle}>
      <div className="container">
        {section.title && (
          <h2 className="text-3xl font-bold mb-2">
            {getLocalizedText(section.title)}
          </h2>
        )}
        {section.subtitle && (
          <p className="text-muted-foreground mb-8">
            {getLocalizedText(section.subtitle)}
          </p>
        )}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${gridCols}`}>
          {items.map((item) => (
            <ContentGridItem
              key={item.id}
              item={item}
              language={language}
              getLocalizedText={getLocalizedText}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ContentItemProps {
  item: ListItem;
  language: string;
  getLocalizedText: (text: LocalizedText | string | undefined) => string;
}

function ContentGridItem({ item, getLocalizedText }: ContentItemProps) {
  const customData = item.custom_data || {};

  return (
    <Card className="overflow-hidden h-full">
      {customData.image && (
        <div className="relative w-full aspect-video">
          <Image
            src={customData.image}
            alt={getLocalizedText(item.label)}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">
          {getLocalizedText(item.label)}
        </h3>
        {customData.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {getLocalizedText(customData.description)}
          </p>
        )}
        {customData.link && customData.link_text && (
          <Button variant="link" className="mt-4 px-0" asChild>
            <Link href={customData.link}>
              {getLocalizedText(customData.link_text)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ContentListItem({ item, getLocalizedText }: ContentItemProps) {
  const customData = item.custom_data || {};

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {customData.image && (
            <div className="relative w-full md:w-64 h-48 flex-shrink-0">
              <Image
                src={customData.image}
                alt={getLocalizedText(item.label)}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-3">
              {getLocalizedText(item.label)}
            </h3>
            {customData.description && (
              <p className="text-muted-foreground">
                {getLocalizedText(customData.description)}
              </p>
            )}
            {customData.link && customData.link_text && (
              <Button variant="outline" className="mt-4" asChild>
                <Link href={customData.link}>
                  {getLocalizedText(customData.link_text)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
