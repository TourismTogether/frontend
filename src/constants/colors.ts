/**
 * Color Constants
 * Centralized color configuration using CSS variables from globals.css
 * Primary color: Green (nature/travel theme)
 */

export const COLORS = {
  // Primary Green Colors (Main Theme)
  PRIMARY: {
    DEFAULT: "bg-accent text-accent-foreground",
    HOVER: "hover:bg-accent/90",
    LIGHT: "bg-accent/10 text-accent",
    BORDER: "border-accent",
    TEXT: "text-accent",
  },

  // Background Colors
  BACKGROUND: {
    DEFAULT: "bg-background",
    CARD: "bg-card",
    MUTED: "bg-muted",
    SECONDARY: "bg-secondary",
  },

  // Text Colors
  TEXT: {
    DEFAULT: "text-foreground",
    MUTED: "text-muted-foreground",
    SECONDARY: "text-secondary-foreground",
    PRIMARY: "text-accent",
  },

  // Border Colors
  BORDER: {
    DEFAULT: "border-border",
    PRIMARY: "border-accent",
    LIGHT: "border-border/50",
  },

  // Green Shades (for travel theme)
  GREEN: {
    50: "bg-green-50 text-green-900",
    100: "bg-green-100 text-green-900",
    200: "bg-green-200 text-green-900",
    300: "bg-green-300 text-green-900",
    400: "bg-green-400 text-white",
    500: "bg-green-500 text-white",
    600: "bg-green-600 text-white",
    700: "bg-green-700 text-white",
    800: "bg-green-800 text-white",
    900: "bg-green-900 text-white",
    // Text variants
    TEXT_50: "text-green-50",
    TEXT_100: "text-green-100",
    TEXT_200: "text-green-200",
    TEXT_300: "text-green-300",
    TEXT_400: "text-green-400",
    TEXT_500: "text-green-500",
    TEXT_600: "text-green-600",
    TEXT_700: "text-green-700",
    TEXT_800: "text-green-800",
    TEXT_900: "text-green-900",
    // Border variants
    BORDER_500: "border-green-500",
    BORDER_600: "border-green-600",
  },

  // Emerald (alternative green for variety)
  EMERALD: {
    50: "bg-emerald-50 text-emerald-900",
    100: "bg-emerald-100 text-emerald-900",
    500: "bg-emerald-500 text-white",
    600: "bg-emerald-600 text-white",
    TEXT_500: "text-emerald-500",
    TEXT_600: "text-emerald-600",
    BORDER_500: "border-emerald-500",
  },

  // Status Colors
  STATUS: {
    SUCCESS: "bg-green-500 text-white",
    ERROR: "bg-destructive text-white",
    WARNING: "bg-amber-500 text-white",
    INFO: "bg-blue-500 text-white",
  },

  // Entity Colors (from globals.css)
  ENTITY: {
    TRAVELLER: "bg-traveller text-white",
    DESTINATION: "bg-destination text-white",
    TRIP: "bg-trip text-white",
    ROUTES: "bg-routes text-white",
    DIARY: "bg-diary text-white",
    POST: "bg-post text-white",
  },
} as const;

// Gradient combinations
export const GRADIENTS = {
  PRIMARY: "bg-gradient-to-r from-green-500 to-emerald-500",
  PRIMARY_LIGHT: "bg-gradient-to-r from-green-400 to-emerald-400",
  PRIMARY_DARK: "bg-gradient-to-r from-green-600 to-emerald-600",
  CARD: "bg-gradient-to-br from-white to-green-50",
  HERO: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500",
} as const;
