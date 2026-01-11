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

  // Auth Page Colors (All 4 Themes)
  AUTH: {
    // Background - All Themes
    CARD: "bg-card/95 dark:bg-slate-800/80 modern:bg-slate-800/80 history:bg-card/95",
    CARD_BLUR: "backdrop-blur-lg dark:backdrop-blur-xl modern:backdrop-blur-xl history:backdrop-blur-lg",
    
    // Text Colors
    TEXT_WHITE: "text-white",
    TEXT_LIGHT: "text-white dark:text-slate-100 modern:text-cyan-50 history:text-amber-900",
    TEXT_MUTED: "text-muted-foreground dark:text-slate-300 modern:text-slate-400 history:text-amber-700",
    TEXT_LABEL: "text-foreground dark:text-slate-200 modern:text-cyan-100 history:text-amber-900",
    
    // Border Colors
    BORDER_CARD: "border-border dark:border-slate-700/50 modern:border-cyan-500/30 history:border-amber-300",
    BORDER_HOVER: "hover:border-accent/30 dark:hover:border-emerald-500/30 modern:hover:border-cyan-400/50 history:hover:border-amber-600/30",
    BORDER_INPUT: "border-border dark:border-slate-600/50 modern:border-cyan-500/30 history:border-amber-300",
    BORDER_FOCUS: "focus:border-accent/50 dark:focus:border-emerald-500/50 modern:focus:border-cyan-400/70 history:focus:border-amber-600/50",
    
    // Input Colors
    INPUT_BG: "bg-background dark:bg-slate-700/50 modern:bg-slate-700/50 history:bg-amber-50",
    INPUT_TEXT: "text-foreground dark:text-slate-100 modern:text-cyan-50 history:text-amber-900",
    INPUT_PLACEHOLDER: "placeholder:text-muted-foreground dark:placeholder:text-slate-400 modern:placeholder:text-slate-400 history:placeholder:text-amber-600",
    INPUT_FOCUS_RING: "focus:ring-accent/20 dark:focus:ring-emerald-500/20 modern:focus:ring-cyan-500/30 history:focus:ring-amber-600/20",
    
    // Icon Colors
    ICON_MUTED: "text-muted-foreground dark:text-slate-400 modern:text-slate-400 history:text-amber-700",
    ICON_EMERALD: "text-emerald-500 dark:text-emerald-400 modern:text-cyan-400 history:text-amber-600",
    ICON_WHITE: "text-white dark:text-emerald-400 modern:text-cyan-300 history:text-amber-800",
    
    // Link Colors
    LINK: "text-accent dark:text-emerald-400 modern:text-cyan-400 history:text-amber-700",
    LINK_HOVER: "hover:text-accent/80 dark:hover:text-emerald-300 modern:hover:text-cyan-300 history:hover:text-amber-800",
    
    // Glassmorphism
    GLASS_BG: "bg-white/20 dark:bg-white/10 modern:bg-cyan-500/10 history:bg-amber-50/30",
    GLASS_BORDER: "border-white/20 dark:border-white/10 modern:border-cyan-400/20 history:border-amber-200/30",
    GLASS_HOVER: "hover:bg-white/20 dark:hover:bg-white/10 modern:hover:bg-cyan-500/15 history:hover:bg-amber-50/40",
  },
} as const;

// Gradient combinations (All 4 Themes)
export const GRADIENTS = {
  PRIMARY: "bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-500 dark:to-emerald-500 modern:from-cyan-500 modern:to-teal-500 history:from-amber-600 history:to-amber-700",
  PRIMARY_LIGHT: "bg-gradient-to-r from-green-400 to-emerald-400 dark:from-green-400 dark:to-emerald-400 modern:from-cyan-400 modern:to-teal-400 history:from-amber-500 history:to-amber-600",
  PRIMARY_DARK: "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-600 dark:to-emerald-600 modern:from-cyan-600 modern:to-teal-600 history:from-amber-700 history:to-amber-800",
  CARD: "bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900 modern:from-slate-800 modern:to-slate-900 history:from-amber-50 history:to-amber-100",
  HERO: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 modern:from-cyan-600 modern:via-teal-600 modern:to-purple-600 history:from-amber-600 history:via-amber-700 history:to-orange-600",
  
  // Auth Page Gradients (All 4 Themes)
  AUTH_BACKGROUND: "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 modern:from-cyan-900 modern:via-teal-800 modern:to-purple-900 history:from-amber-600 history:via-orange-600 history:to-amber-700",
  AUTH_TITLE: "bg-gradient-to-r from-white to-emerald-100 dark:from-white dark:to-emerald-100 modern:from-cyan-200 modern:to-teal-200 history:from-amber-900 history:to-amber-800 bg-clip-text text-transparent",
  AUTH_HEADING: "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 modern:from-cyan-400 modern:via-teal-400 modern:to-purple-400 history:from-amber-800 history:via-amber-700 history:to-orange-700 bg-clip-text text-transparent",
  AUTH_BUTTON: "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-emerald-500 dark:via-green-500 dark:to-teal-500 modern:from-cyan-500 modern:via-teal-500 modern:to-purple-500 history:from-amber-700 history:via-amber-600 history:to-orange-600",
  AUTH_BUTTON_HOVER: "hover:from-green-700 hover:to-emerald-700 dark:hover:from-emerald-600 dark:hover:via-green-600 dark:hover:to-teal-600 modern:hover:from-cyan-600 modern:hover:via-teal-600 modern:hover:to-purple-600 history:hover:from-amber-800 history:hover:via-amber-700 history:hover:to-orange-700",
  AUTH_FEATURE_ICON: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/20 dark:to-teal-400/20 modern:from-cyan-500/20 modern:to-teal-500/20 history:from-amber-500/20 history:to-orange-500/20",
  
  // Background Orbs (for animations - All 4 Themes)
  AUTH_ORB_EMERALD: "bg-white/10 dark:bg-emerald-500/20 modern:bg-cyan-500/20 history:bg-amber-500/20",
  AUTH_ORB_TEAL: "bg-white/10 dark:bg-teal-500/20 modern:bg-teal-500/20 history:bg-orange-500/20",
  AUTH_ORB_GREEN: "bg-white/5 dark:bg-green-500/10 modern:bg-cyan-500/10 history:bg-amber-500/10",
  AUTH_ORB_CYAN: "bg-white/5 dark:bg-cyan-500/10 modern:bg-purple-500/10 history:bg-orange-500/10",
} as const;
