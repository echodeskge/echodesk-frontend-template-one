"use client";

import { useEffect, useState } from "react";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function StatisticsSection({ section, language }: HomepageSectionProps) {
  const items = section.data || [];
  const settings = section.settings || {};
  const columns = settings.columns || 4;

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
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  }[columns] || "md:grid-cols-4";

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
            const value = customData.value || customData.number || 0;
            const suffix = customData.suffix || "";
            const prefix = customData.prefix || "";
            const icon = customData.icon;
            const description = customData.description;

            return (
              <StatCounter
                key={item.id}
                label={getLocalizedText(item.label)}
                value={value}
                prefix={prefix}
                suffix={suffix}
                icon={icon}
                description={description ? getLocalizedText(description) : undefined}
                animate={settings.animate !== false}
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
  value: number;
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
  const [count, setCount] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setCount(value);
      return;
    }

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
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
      <div className="text-4xl font-bold text-primary">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2 text-lg font-semibold">{label}</div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
