"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paintbrush, RotateCcw } from "lucide-react";

interface ThemePreset {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    destructive: string;
    border: string;
    card: string;
  };
  radius: string;
}

const PRESETS: Record<string, ThemePreset> = {
  default: {
    name: "Default",
    colors: {
      primary: "221 83% 53%",
      secondary: "215 16% 47%",
      accent: "221 83% 53%",
      background: "0 0% 100%",
      foreground: "0 0% 9%",
      muted: "0 0% 96%",
      destructive: "0 84.2% 60.2%",
      border: "0 0% 90%",
      card: "0 0% 100%",
    },
    radius: "0.5rem",
  },
  rounded: {
    name: "Rounded",
    colors: {
      primary: "262 83% 58%",
      secondary: "260 16% 47%",
      accent: "262 83% 58%",
      background: "0 0% 100%",
      foreground: "0 0% 9%",
      muted: "260 10% 96%",
      destructive: "0 84.2% 60.2%",
      border: "260 10% 90%",
      card: "0 0% 100%",
    },
    radius: "1rem",
  },
  sharp: {
    name: "Sharp",
    colors: {
      primary: "0 0% 9%",
      secondary: "0 0% 45%",
      accent: "0 0% 9%",
      background: "0 0% 100%",
      foreground: "0 0% 9%",
      muted: "0 0% 96%",
      destructive: "0 84.2% 60.2%",
      border: "0 0% 80%",
      card: "0 0% 100%",
    },
    radius: "0",
  },
  soft: {
    name: "Soft Pastel",
    colors: {
      primary: "340 65% 65%",
      secondary: "200 30% 70%",
      accent: "340 65% 65%",
      background: "0 0% 99%",
      foreground: "0 0% 20%",
      muted: "340 20% 95%",
      destructive: "0 65% 65%",
      border: "340 20% 88%",
      card: "0 0% 100%",
    },
    radius: "0.75rem",
  },
  ocean: {
    name: "Ocean Blue",
    colors: {
      primary: "199 89% 48%",
      secondary: "199 50% 60%",
      accent: "175 77% 43%",
      background: "0 0% 100%",
      foreground: "199 89% 10%",
      muted: "199 30% 95%",
      destructive: "0 84.2% 60.2%",
      border: "199 30% 88%",
      card: "0 0% 100%",
    },
    radius: "0.5rem",
  },
  forest: {
    name: "Forest Green",
    colors: {
      primary: "142 76% 36%",
      secondary: "142 40% 50%",
      accent: "142 76% 36%",
      background: "0 0% 100%",
      foreground: "142 76% 10%",
      muted: "142 20% 95%",
      destructive: "0 84.2% 60.2%",
      border: "142 20% 88%",
      card: "0 0% 100%",
    },
    radius: "0.5rem",
  },
  sunset: {
    name: "Sunset Orange",
    colors: {
      primary: "25 95% 53%",
      secondary: "25 50% 60%",
      accent: "45 93% 47%",
      background: "0 0% 100%",
      foreground: "25 95% 10%",
      muted: "25 30% 95%",
      destructive: "0 84.2% 60.2%",
      border: "25 30% 88%",
      card: "0 0% 100%",
    },
    radius: "0.625rem",
  },
};

// Helper to convert HSL string to individual values
const parseHSL = (hsl: string): { h: number; s: number; l: number } => {
  const parts = hsl.split(" ");
  return {
    h: parseInt(parts[0]),
    s: parseFloat(parts[1]),
    l: parseFloat(parts[2]),
  };
};

// Helper to convert HSL values to string
const hslToString = (h: number, s: number, l: number): string => {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
};

// Apply theme to CSS variables
const applyThemeToDOM = (theme: ThemePreset) => {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVarName = key === "card" ? "--card" : `--${key.replace(/_/g, "-")}`;
    root.style.setProperty(cssVarName, value);
  });

  // Set derived colors
  root.style.setProperty("--input", theme.colors.border);
  root.style.setProperty("--ring", theme.colors.primary);
  root.style.setProperty("--primary-foreground", theme.colors.background);
  root.style.setProperty("--secondary-foreground", theme.colors.foreground);
  root.style.setProperty("--accent-foreground", theme.colors.foreground);
  root.style.setProperty("--destructive-foreground", theme.colors.background);
  root.style.setProperty("--muted-foreground", "0 0% 45%");
  root.style.setProperty("--card-foreground", theme.colors.foreground);
  root.style.setProperty("--popover", theme.colors.card);
  root.style.setProperty("--popover-foreground", theme.colors.foreground);

  // Set radius
  root.style.setProperty("--radius", theme.radius);
};

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("default");
  const [customTheme, setCustomTheme] = useState<ThemePreset>(PRESETS.default);
  const [radiusValue, setRadiusValue] = useState([0.5]);

  // Only show on demo tenant
  const [isDemoTenant, setIsDemoTenant] = useState(false);

  useEffect(() => {
    // Check if this is the demo tenant
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    setIsDemoTenant(apiUrl.includes("demo.api.echodesk.ge"));
  }, []);

  useEffect(() => {
    // Parse radius value from string
    const radiusNum = parseFloat(customTheme.radius.replace("rem", ""));
    setRadiusValue([radiusNum]);
  }, [customTheme.radius]);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const newTheme = PRESETS[preset];
    setCustomTheme(newTheme);
    applyThemeToDOM(newTheme);
  };

  const handleColorChange = (colorKey: string, value: string) => {
    const newTheme = {
      ...customTheme,
      colors: {
        ...customTheme.colors,
        [colorKey]: value,
      },
    };
    setCustomTheme(newTheme);
    setSelectedPreset("custom");
    applyThemeToDOM(newTheme);
  };

  const handleRadiusChange = (value: number[]) => {
    setRadiusValue(value);
    const newTheme = {
      ...customTheme,
      radius: `${value[0]}rem`,
    };
    setCustomTheme(newTheme);
    setSelectedPreset("custom");
    applyThemeToDOM(newTheme);
  };

  const resetToDefault = () => {
    handlePresetChange("default");
  };

  if (!isDemoTenant) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Paintbrush className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Theme Customizer
          </SheetTitle>
          <SheetDescription>
            Customize the look and feel of your store. Changes are applied instantly.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Preset Selector */}
          <div className="space-y-2">
            <Label>Theme Preset</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <Label>Border Radius: {radiusValue[0]}rem</Label>
            <Slider
              value={radiusValue}
              onValueChange={handleRadiusChange}
              max={2}
              min={0}
              step={0.125}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sharp</span>
              <span>Rounded</span>
            </div>
          </div>

          {/* Color Inputs */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Colors</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Primary</Label>
                <Input
                  value={customTheme.colors.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  placeholder="221 83% 53%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Secondary</Label>
                <Input
                  value={customTheme.colors.secondary}
                  onChange={(e) => handleColorChange("secondary", e.target.value)}
                  placeholder="215 16% 47%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Accent</Label>
                <Input
                  value={customTheme.colors.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  placeholder="221 83% 53%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Background</Label>
                <Input
                  value={customTheme.colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  placeholder="0 0% 100%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Foreground</Label>
                <Input
                  value={customTheme.colors.foreground}
                  onChange={(e) => handleColorChange("foreground", e.target.value)}
                  placeholder="0 0% 9%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Muted</Label>
                <Input
                  value={customTheme.colors.muted}
                  onChange={(e) => handleColorChange("muted", e.target.value)}
                  placeholder="0 0% 96%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Border</Label>
                <Input
                  value={customTheme.colors.border}
                  onChange={(e) => handleColorChange("border", e.target.value)}
                  placeholder="0 0% 90%"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Destructive</Label>
                <Input
                  value={customTheme.colors.destructive}
                  onChange={(e) => handleColorChange("destructive", e.target.value)}
                  placeholder="0 84.2% 60.2%"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={resetToDefault}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>

          {/* Info */}
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">HSL Color Format</p>
            <p className="text-muted-foreground">
              Colors are in HSL format: <code className="bg-background px-1 py-0.5 rounded">Hue Saturation% Lightness%</code>
            </p>
            <p className="text-muted-foreground mt-2">
              Example: <code className="bg-background px-1 py-0.5 rounded">221 83% 53%</code> is a blue color.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
