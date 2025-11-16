"use client";

import { useEffect, useState } from "react";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function StatisticsSection({ section, language }: HomepageSectionProps) {
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

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  }[columns] || "md:grid-cols-3";

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-16" style={sectionStyle}>
      <div className="container">
        {section.title && (
          <h2 className="text-3xl font-bold text-center mb-2">
            {getLocalizedText(section.title)}
          </h2>
        )}
        {section.subtitle && (
          <p className="text-center text-muted-foreground mb-12">
            {getLocalizedText(section.subtitle)}
          </p>
        )}
        <div className={`grid grid-cols-1 gap-8 ${gridCols}`}>
          {items.map((item) => {
            const customData = item.custom_data || {};
            // Support both "count" (from API) and "value"/"number" formats
            const value = customData.count || customData.value || customData.number || item.label || "0";
            const suffix = customData.suffix || "";
            const prefix = customData.prefix || "";
            const icon = customData.icon;
            // Get label from custom_data with language suffix, or fall back to item.label
            const label = getCustomDataText(customData, "label") || getLocalizedText(item.label);

            return (
              <StatCounter
                key={item.id}
                label={label}
                value={value}
                prefix={prefix}
                suffix={suffix}
                icon={icon}
                animate={settings.showAnimation !== false}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface StatCounterProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon?: string;
  description?: string;
  animate?: boolean;
}

function StatCounter({
  label,
  value,
  prefix = "",
  suffix = "",
  icon,
  description,
  animate = true,
}: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(animate ? "0" : String(value));

  useEffect(() => {
    if (!animate || typeof value === "string") {
      setDisplayValue(String(value));
      return;
    }

    const numericValue = typeof value === "number" ? value : parseInt(String(value).replace(/\D/g, ""), 10);
    if (isNaN(numericValue)) {
      setDisplayValue(String(value));
      return;
    }

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(String(value));
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current).toLocaleString());
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, animate]);

  return (
    <div className="text-center">
      {icon && (
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      )}
      <div className="text-4xl md:text-5xl font-bold">
        {prefix}
        {displayValue}
        {suffix}
      </div>
      <div className="mt-2 text-lg font-semibold">{label}</div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
