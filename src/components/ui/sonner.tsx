"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--background))",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "hsl(142.1 76.2% 36.3%)",
          "--success-text": "hsl(0 0% 100%)",
          "--success-border": "hsl(142.1 76.2% 30%)",
          "--error-bg": "hsl(0 84.2% 60.2%)",
          "--error-text": "hsl(0 0% 100%)",
          "--error-border": "hsl(0 84.2% 50%)",
          "--warning-bg": "hsl(38 92% 50%)",
          "--warning-text": "hsl(0 0% 0%)",
          "--warning-border": "hsl(38 92% 40%)",
          "--info-bg": "hsl(221.2 83.2% 53.3%)",
          "--info-text": "hsl(0 0% 100%)",
          "--info-border": "hsl(221.2 83.2% 45%)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
