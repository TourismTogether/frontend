/**
 * Animation Constants
 * Reusable animation classes and utilities for travel-themed effects
 */

export const ANIMATIONS = {
  // Floating animations (for clouds, birds, etc.)
  FLOAT: {
    SLOW: "animate-float-slow",
    MEDIUM: "animate-float-medium",
    FAST: "animate-float-fast",
    REVERSE: "animate-float-reverse",
  },

  // Pulse/Glow effects
  PULSE: {
    GENTLE: "animate-pulse-gentle",
    GLOW: "animate-pulse-glow",
    SOFT: "animate-pulse-soft",
  },

  // Rotation animations
  ROTATE: {
    SLOW: "animate-rotate-slow",
    MEDIUM: "animate-rotate-medium",
    CONTINUOUS: "animate-spin",
  },

  // Slide animations
  SLIDE: {
    UP: "animate-slide-up",
    DOWN: "animate-slide-down",
    LEFT: "animate-slide-left",
    RIGHT: "animate-slide-right",
  },

  // Fade animations
  FADE: {
    IN: "animate-fade-in",
    OUT: "animate-fade-out",
    IN_UP: "animate-fade-in-up",
    IN_DOWN: "animate-fade-in-down",
  },

  // Bounce animations
  BOUNCE: {
    GENTLE: "animate-bounce-gentle",
    SOFT: "animate-bounce-soft",
  },

  // Shimmer/Shine effects
  SHIMMER: "animate-shimmer",
  
  // Wave animations
  WAVE: "animate-wave",
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: "duration-300",
  MEDIUM: "duration-500",
  SLOW: "duration-700",
  VERY_SLOW: "duration-1000",
} as const;

// Animation delays
export const ANIMATION_DELAYS = {
  NONE: "delay-0",
  SHORT: "delay-75",
  MEDIUM: "delay-150",
  LONG: "delay-300",
  VERY_LONG: "delay-500",
} as const;

// Easing functions
export const EASING = {
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  LINEAR: "linear",
} as const;
