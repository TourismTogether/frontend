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
    MUTED_HOVER: "hover:bg-muted",
    MUTED_HOVER_OPACITY: "hover:bg-muted/80",
  },

  // Text Colors
  TEXT: {
    DEFAULT: "text-foreground",
    MUTED: "text-muted-foreground",
    SECONDARY: "text-secondary-foreground",
    PRIMARY: "text-accent",
    PRIMARY_HOVER: "hover:text-accent/80",
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
    400: "bg-emerald-400 text-white",
    500: "bg-emerald-500 text-white",
    600: "bg-emerald-600 text-white",
    TEXT_400: "text-emerald-400",
    TEXT_500: "text-emerald-500",
    TEXT_600: "text-emerald-600",
    BORDER_400: "border-emerald-400",
    BORDER_500: "border-emerald-500",
    // Opacity variants for dark mode
    BG_400_10: "bg-emerald-400/10",
    BG_400_20: "bg-emerald-400/20",
    BG_500_10: "bg-emerald-500/10",
    BG_500_20: "bg-emerald-500/20",
    BORDER_400_20: "border-emerald-400/20",
    BORDER_400_30: "border-emerald-400/30",
    BORDER_500_20: "border-emerald-500/20",
    BORDER_500_30: "border-emerald-500/30",
  },

  // Destructive Colors (for errors, delete actions)
  DESTRUCTIVE: {
    BACKGROUND: "bg-destructive",
    TEXT: "text-destructive",
    BORDER: "border-destructive",
    TEXT_HOVER: "hover:text-destructive/80",
    BACKGROUND_HOVER: "hover:bg-destructive/10",
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

  // Auth Page Colors (Light & Dark Mode)
  AUTH: {
    // Background - Light Mode
    CARD: "bg-card/95 dark:bg-slate-800/80 dark:bg-slate-900/90",
    CARD_BLUR: "backdrop-blur-lg dark:backdrop-blur-xl",
    
    // Text Colors
    TEXT_WHITE: "text-white",
    TEXT_LIGHT: "text-white dark:text-slate-100",
    TEXT_MUTED: "text-muted-foreground dark:text-slate-300 dark:text-slate-400",
    TEXT_LABEL: "text-foreground dark:text-slate-200 dark:text-slate-100",
    
    // Border Colors
    BORDER_CARD: "border-border dark:border-slate-700/50 dark:border-slate-700/30",
    BORDER_HOVER: "hover:border-accent/30 dark:hover:border-emerald-500/30 dark:hover:border-emerald-400/30",
    BORDER_INPUT: "border-border dark:border-slate-600/50 dark:border-slate-700/50",
    BORDER_FOCUS: "focus:border-accent/50 dark:focus:border-emerald-500/50 dark:focus:border-emerald-400/50",
    
    // Input Colors
    INPUT_BG: "bg-background dark:bg-slate-700/50 dark:bg-slate-800/50",
    INPUT_TEXT: "text-foreground dark:text-slate-100",
    INPUT_PLACEHOLDER: "placeholder:text-muted-foreground dark:placeholder:text-slate-400 dark:placeholder:text-slate-500",
    INPUT_FOCUS_RING: "focus:ring-accent/20 dark:focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20",
    
    // Icon Colors
    ICON_MUTED: "text-muted-foreground dark:text-slate-400 dark:text-slate-500",
    ICON_EMERALD: "text-emerald-500 dark:text-emerald-400 dark:text-emerald-300",
    ICON_WHITE: "text-white dark:text-emerald-400 dark:text-emerald-300",
    
    // Link Colors
    LINK: "text-accent dark:text-emerald-400 dark:text-emerald-300",
    LINK_HOVER: "hover:text-accent/80 dark:hover:text-emerald-300 dark:hover:text-emerald-200",
    
    // Glassmorphism
    GLASS_BG: "bg-white/20 dark:bg-white/10 dark:bg-white/5",
    GLASS_BORDER: "border-white/20 dark:border-white/10 dark:border-white/5",
    GLASS_HOVER: "hover:bg-white/20 dark:hover:bg-white/10",
  },
} as const;

// Gradient combinations
export const GRADIENTS = {
  PRIMARY: "bg-gradient-to-r from-green-500 to-emerald-500",
  PRIMARY_LIGHT: "bg-gradient-to-r from-green-400 to-emerald-400",
  PRIMARY_DARK: "bg-gradient-to-r from-green-600 to-emerald-600",
  CARD: "bg-gradient-to-br from-white to-green-50",
  HERO: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500",
  
  // Auth Page Gradients (Light & Dark Mode)
  AUTH_BACKGROUND: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:from-slate-950",
  AUTH_TITLE: "bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent",
  AUTH_HEADING: "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent",
  AUTH_BUTTON: "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-emerald-500 dark:via-green-500 dark:to-teal-500",
  AUTH_BUTTON_HOVER: "hover:from-green-700 hover:to-emerald-700 dark:hover:from-emerald-600 dark:hover:via-green-600 dark:hover:to-teal-600",
  AUTH_FEATURE_ICON: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/20 dark:to-teal-400/20",
  
  // Background Orbs (for animations - Light & Dark Mode)
  AUTH_ORB_EMERALD: "bg-white/10 dark:bg-emerald-500/20 dark:bg-emerald-400/10",
  AUTH_ORB_TEAL: "bg-white/10 dark:bg-teal-500/20 dark:bg-teal-400/10",
  AUTH_ORB_GREEN: "bg-white/5 dark:bg-green-500/10 dark:bg-green-400/5",
  AUTH_ORB_CYAN: "bg-white/5 dark:bg-cyan-500/10 dark:bg-cyan-400/5",
} as const;
