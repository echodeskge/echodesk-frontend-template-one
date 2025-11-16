"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageSectionProps, ListItem, LocalizedText } from "@/types/homepage";

export function HeroBannerSection({ section, language }: HomepageSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const items = section.data || [];
  const settings = section.settings || {};

  const getLocalizedText = (text: LocalizedText | string | undefined): string => {
    if (!text) return "";
    if (typeof text === "string") return text;
    return text[language] || text.en || text.ka || Object.values(text)[0] || "";
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + items.length) % items.length);
  };

  // Auto-slide functionality
  useEffect(() => {
    if (!settings.autoSlide || items.length <= 1) return;

    const interval = setInterval(nextSlide, settings.slideInterval || 5000);
    return () => clearInterval(interval);
  }, [settings.autoSlide, settings.slideInterval, items.length, nextSlide]);

  if (items.length === 0) {
    return null;
  }

  const sectionStyle = {
    backgroundColor: section.background_color || undefined,
    backgroundImage: section.background_image_url
      ? `url(${section.background_image_url})`
      : undefined,
    color: section.text_color || undefined,
  };

  // Single banner mode
  if (section.display_mode === "single" || items.length === 1) {
    const item = items[0];
    const customData = item.custom_data || {};

    return (
      <section className="relative overflow-hidden" style={sectionStyle}>
        <div className="container py-20 md:py-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            <div className="max-w-2xl">
              {section.title && (
                <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                  {getLocalizedText(section.title)}
                </h1>
              )}
              {section.subtitle && (
                <p className="mt-6 text-lg text-muted-foreground">
                  {getLocalizedText(section.subtitle)}
                </p>
              )}
              {customData.description && (
                <p className="mt-4 text-muted-foreground">
                  {getLocalizedText(customData.description)}
                </p>
              )}
              <div className="mt-8 flex gap-4">
                {customData.primary_button_text && customData.primary_button_link && (
                  <Button size="lg" asChild>
                    <Link href={customData.primary_button_link}>
                      {getLocalizedText(customData.primary_button_text)}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
                {customData.secondary_button_text && customData.secondary_button_link && (
                  <Button size="lg" variant="outline" asChild>
                    <Link href={customData.secondary_button_link}>
                      {getLocalizedText(customData.secondary_button_text)}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            {customData.image && (
              <div className="relative aspect-video md:aspect-square">
                <Image
                  src={customData.image}
                  alt={getLocalizedText(item.label)}
                  fill
                  className="object-cover rounded-lg"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Slider mode
  const currentItem = items[currentSlide];
  const currentCustomData = currentItem?.custom_data || {};

  return (
    <section className="relative overflow-hidden" style={sectionStyle}>
      <div className="container py-20 md:py-32">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {getLocalizedText(currentItem?.label) || getLocalizedText(section.title)}
            </h1>
            {currentCustomData.description && (
              <p className="mt-6 text-lg text-muted-foreground">
                {getLocalizedText(currentCustomData.description)}
              </p>
            )}
            <div className="mt-8 flex gap-4">
              {currentCustomData.primary_button_text && currentCustomData.primary_button_link && (
                <Button size="lg" asChild>
                  <Link href={currentCustomData.primary_button_link}>
                    {getLocalizedText(currentCustomData.primary_button_text)}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              {currentCustomData.secondary_button_text && currentCustomData.secondary_button_link && (
                <Button size="lg" variant="outline" asChild>
                  <Link href={currentCustomData.secondary_button_link}>
                    {getLocalizedText(currentCustomData.secondary_button_text)}
                  </Link>
                </Button>
              )}
            </div>
          </div>
          {currentCustomData.image && (
            <div className="relative aspect-video md:aspect-square">
              <Image
                src={currentCustomData.image}
                alt={getLocalizedText(currentItem?.label)}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          )}
        </div>

        {/* Slider Controls */}
        {items.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentSlide ? "bg-primary" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
