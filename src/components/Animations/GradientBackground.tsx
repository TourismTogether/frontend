"use client";

import React from "react";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface GradientBackgroundProps {
  variant?: "primary" | "secondary" | "accent" | "custom";
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = "primary",
  animated = true,
  className = "",
  children,
}) => {
  const gradientClasses = {
    primary: GRADIENTS.PRIMARY,
    secondary: GRADIENTS.PRIMARY_LIGHT,
    accent: GRADIENTS.PRIMARY_DARK,
    custom: "",
  };

  return (
    <div
      className={`${gradientClasses[variant]} ${
        animated ? "animate-gradient" : ""
      } ${className} relative overflow-hidden`}
    >
      {children}
    </div>
  );
};

export default GradientBackground;
