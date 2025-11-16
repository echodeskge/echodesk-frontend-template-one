"use client";

import Image from "next/image";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function BranchesSection({ section, language }: HomepageSectionProps) {
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

  const gridCols = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  }[columns] || "lg:grid-cols-3";

  if (items.length === 0) {
    return null;
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
            {items.map((item) => {
              const customData = item.custom_data || {};
              return (
                <Card key={item.id}>
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
                        <div className="space-y-2">
                          {customData.address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                              <span>{getLocalizedText(customData.address)}</span>
                            </div>
                          )}
                          {customData.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-5 w-5" />
                              <a
                                href={`tel:${customData.phone}`}
                                className="hover:text-primary"
                              >
                                {customData.phone}
                              </a>
                            </div>
                          )}
                          {customData.hours && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-5 w-5" />
                              <span>{getLocalizedText(customData.hours)}</span>
                            </div>
                          )}
                        </div>
                        {customData.map_link && (
                          <Button variant="outline" className="mt-4" asChild>
                            <a
                              href={customData.map_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {language === "ka" ? "რუკაზე ნახვა" : "View on Map"}
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Grid mode - default
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
          {items.map((item) => {
            const customData = item.custom_data || {};
            return (
              <Card key={item.id} className="overflow-hidden">
                {customData.image && (
                  <div className="relative w-full h-48">
                    <Image
                      src={customData.image}
                      alt={getLocalizedText(item.label)}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {getLocalizedText(item.label)}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {customData.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{getLocalizedText(customData.address)}</span>
                      </div>
                    )}
                    {customData.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a
                          href={`tel:${customData.phone}`}
                          className="hover:text-primary"
                        >
                          {customData.phone}
                        </a>
                      </div>
                    )}
                    {customData.hours && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{getLocalizedText(customData.hours)}</span>
                      </div>
                    )}
                  </div>
                  {customData.map_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      asChild
                    >
                      <a
                        href={customData.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {language === "ka" ? "რუკაზე ნახვა" : "View on Map"}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
