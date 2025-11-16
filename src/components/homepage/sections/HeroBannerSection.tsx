"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageSectionProps, LocalizedText } from "@/types/homepage";

export function HeroBannerSection({ section, language }: HomepageSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const items = section.data || [];
  const settings = section.settings || {};

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

  // Slider mode - render full-screen hero banners
  const currentItem = items[currentSlide];
  const currentCustomData = currentItem?.custom_data || {};
  const backgroundImage = currentCustomData.background_image || currentCustomData.image;
  const overlayColor = currentCustomData.overlay_color || "rgba(0, 0, 0, 0.4)";
  const textColor = currentCustomData.text_color || section.text_color || "#ffffff";

  // Get title parts or full title
  const titlePart1 = getCustomDataText(currentCustomData, "title_part1");
  const titlePart2 = getCustomDataText(currentCustomData, "title_part2");
  const fullTitle = titlePart1 && titlePart2
    ? null
    : getCustomDataText(currentCustomData, "title") || getLocalizedText(section.title);

  const description = getCustomDataText(currentCustomData, "description");
  const buttonText = getCustomDataText(currentCustomData, "button_text");
  const buttonLink = currentCustomData.button_link || "/products";

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image */}
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt={getLocalizedText(currentItem?.label) || "Hero Banner"}
          fill
          className="object-cover"
          priority
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor }}
      />

      {/* Content */}
      <div className="relative h-full container flex items-center">
        <div className="max-w-3xl" style={{ color: textColor }}>
          {titlePart1 && titlePart2 ? (
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block">{titlePart1}</span>
              <span className="block mt-2">{titlePart2}</span>
            </h1>
          ) : fullTitle ? (
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              {fullTitle}
            </h1>
          ) : null}

          {description && (
            <p className="mt-6 text-lg md:text-xl opacity-90 max-w-2xl">
              {description}
            </p>
          )}

          {buttonText && buttonLink && (
            <div className="mt-8">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90"
                asChild
              >
                <Link href={buttonLink}>
                  {buttonText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Slider Controls */}
      {items.length > 1 && (
        <>
          {settings.showArrows !== false && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-3 rounded-full transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Dots */}
          {settings.showDots !== false && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
