"use client";

import React from "react";
import { ANIMATIONS } from "../../constants/animations";
import { COLORS } from "../../constants/colors";

interface ShimmerCardProps {
  children: React.ReactNode;
  className?: string;
  shimmer?: boolean;
}

export const ShimmerCard: React.FC<ShimmerCardProps> = ({
  children,
  className = "",
  shimmer = true,
}) => {
  return (
    <div
      className={`${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-lg overflow-hidden relative ${
        shimmer ? ANIMATIONS.SHIMMER : ""
      } ${className} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
    >
      {children}
    </div>
  );
};

export default ShimmerCard;
