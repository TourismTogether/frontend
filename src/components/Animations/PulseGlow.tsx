"use client";

import React from "react";
import { ANIMATIONS } from "../../constants/animations";
import { COLORS } from "../../constants/colors";

interface PulseGlowProps {
  children: React.ReactNode;
  variant?: "gentle" | "glow" | "soft";
  color?: "primary" | "accent" | "custom";
  customColor?: string;
  className?: string;
}

export const PulseGlow: React.FC<PulseGlowProps> = ({
  children,
  variant = "gentle",
  color = "primary",
  customColor,
  className = "",
}) => {
  const pulseClasses = {
    gentle: ANIMATIONS.PULSE.GENTLE,
    glow: ANIMATIONS.PULSE.GLOW,
    soft: ANIMATIONS.PULSE.SOFT,
  };

  const colorClasses = {
    primary: COLORS.PRIMARY.TEXT,
    accent: COLORS.TEXT.PRIMARY,
    custom: "",
  };

  return (
    <div
      className={`${pulseClasses[variant]} ${colorClasses[color]} ${className} transition-colors duration-300`}
      style={customColor ? { color: customColor } : {}}
    >
      {children}
    </div>
  );
};

export default PulseGlow;
