"use client";

import React from "react";
import Image from "next/image";
import { COLORS, GRADIENTS } from "../../constants/colors";
import { getTravelImageUrl, getDestinationImageUrl } from "../../constants/api";

interface HeroProps {
  title: string;
  description?: string;
  subtitle?: string;
  imageKeyword?: string;
  imageUrl?: string;
  height?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Hero: React.FC<HeroProps> = ({
  title,
  description,
  subtitle,
  imageKeyword = "travel adventure",
  imageUrl,
  height = "medium",
  icon,
  children,
  className = "",
}) => {
  const heightClasses = {
    small: "h-48 md:h-56",
    medium: "h-64 md:h-80",
    large: "h-80 md:h-96",
  };

  const finalImageUrl =
    imageUrl || getTravelImageUrl(imageKeyword, 1920, 600);

  return (
    <div className={`relative ${heightClasses[height]} overflow-hidden ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={finalImageUrl}
          alt={title}
          fill
          className="object-cover"
          priority
          unoptimized
          quality={90}
        />
        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 ${GRADIENTS.PRIMARY_DARK} opacity-85 transition-opacity duration-300`}
        ></div>
        {/* Additional subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col items-start">
            {/* Icon/Emoji */}
            {icon && (
              <div className="mb-4 transform transition-transform duration-300 hover:scale-110">
                {icon}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-2xl leading-tight">
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 drop-shadow-lg mb-2 max-w-3xl leading-relaxed">
                {description}
              </p>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm sm:text-base md:text-lg text-white/85 drop-shadow-md mt-1">
                {subtitle}
              </p>
            )}

            {/* Custom Children Content */}
            {children && (
              <div className="mt-4 w-full">{children}</div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative bottom wave (optional) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Hero;
