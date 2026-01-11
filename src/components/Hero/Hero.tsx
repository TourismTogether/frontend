"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useTheme } from "next-themes";
import { COLORS, GRADIENTS } from "../../constants/colors";
import { getTravelImageUrl } from "../../constants/api";
import { Sparkles, TrendingUp, Users, MapPin, Calendar } from "lucide-react";

interface HeroProps {
  title: string;
  description?: string;
  subtitle?: string;
  proverb?: string; // Câu ca dao tục ngữ
  imageKeyword?: string;
  imageUrl?: string;
  height?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
}

// Magical Grid Pattern Component
const MagicalGrid: React.FC<{ theme: string }> = ({ theme }) => {
  const getGridColor = () => {
    switch (theme) {
      case "dark":
        return "rgba(255,255,255,0.1)";
      case "modern":
        return "rgba(99,102,241,0.15)"; // indigo
      case "history":
        return "rgba(217,119,6,0.15)"; // amber
      default: // light
        return "rgba(0,0,0,0.1)";
    }
  };

  return (
    <div className="absolute inset-0 opacity-30 dark:opacity-20 modern:opacity-25 history:opacity-25">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={getGridColor()}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

// Animated Light Orbs
const LightOrbs: React.FC<{ theme: string }> = ({ theme }) => {
  const orbs = [
    { x: "10%", y: "20%", delay: 0, size: 200 },
    { x: "80%", y: "30%", delay: 0.5, size: 150 },
    { x: "50%", y: "70%", delay: 1, size: 180 },
    { x: "20%", y: "80%", delay: 1.5, size: 120 },
    { x: "90%", y: "60%", delay: 2, size: 160 },
  ];

  const getOrbGradient = () => {
    switch (theme) {
      case "dark":
        return "bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30";
      case "modern":
        return "bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30";
      case "history":
        return "bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-yellow-500/30";
      default: // light
        return "bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20";
    }
  };

  return (
    <>
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${getOrbGradient()}`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, Math.random() * 50 - 25],
            y: [0, Math.random() * 50 - 25],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

// Floating Particles
const FloatingParticles: React.FC<{ theme: string }> = ({ theme }) => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  const getParticleColor = () => {
    switch (theme) {
      case "dark":
        return "bg-white/40";
      case "modern":
        return "bg-cyan-300/40";
      case "history":
        return "bg-amber-300/40";
      default: // light
        return "bg-black/20";
    }
  };

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute w-1 h-1 rounded-full ${getParticleColor()}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

// Shimmer Effect
const ShimmerEffect: React.FC = () => {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      style={{
        transform: "skewX(-20deg)",
      }}
      animate={{
        x: ["-100%", "200%"],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut",
      }}
    />
  );
};

export const Hero: React.FC<HeroProps> = ({
  title,
  description,
  subtitle,
  proverb,
  imageKeyword = "travel adventure",
  imageUrl,
  height = "medium",
  icon,
  children,
  className = "",
  stats,
  features,
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const currentTheme = mounted ? theme || "light" : "light";
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    });
  }, [controls]);

  const heightClasses = {
    small: "h-64 md:h-80",
    medium: "h-80 md:h-96 lg:h-[500px]",
    large: "h-96 md:h-[600px] lg:h-[700px]",
  };

  const finalImageUrl = imageUrl || getTravelImageUrl(imageKeyword, 1920, 800);

  // Dynamic gradient based on theme
  const getOverlayGradient = () => {
    switch (currentTheme) {
      case "dark":
        return "bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-800/80";
      case "modern":
        return "bg-gradient-to-br from-cyan-900/80 via-teal-800/70 to-purple-900/80";
      case "history":
        return "bg-gradient-to-br from-amber-700/80 via-orange-700/70 to-amber-800/80";
      default: // light
        return "bg-gradient-to-br from-blue-600/70 via-purple-600/60 to-pink-600/70";
    }
  };

  const getDepthOverlay = () => {
    switch (currentTheme) {
      case "dark":
        return "bg-gradient-to-t from-black/60 via-transparent to-transparent";
      case "modern":
        return "bg-gradient-to-t from-cyan-950/60 via-transparent to-transparent";
      case "history":
        return "bg-gradient-to-t from-amber-900/50 via-transparent to-transparent";
      default: // light
        return "bg-gradient-to-t from-black/40 via-transparent to-transparent";
    }
  };

  const getTitleGradient = () => {
    switch (currentTheme) {
      case "dark":
        return "bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent";
      case "modern":
        return "bg-gradient-to-r from-cyan-200 via-teal-200 to-purple-200 bg-clip-text text-transparent";
      case "history":
        return "bg-gradient-to-r from-white via-amber-200 to-orange-200 bg-clip-text text-transparent";
      default: // light
        return "bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent";
    }
  };

  const getDescriptionColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-100";
      case "modern":
        return "text-cyan-100";
      case "history":
        return "text-amber-100";
      default: // light
        return "text-blue-50";
    }
  };

  const getSubtitleColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-200/90";
      case "modern":
        return "text-indigo-200/90";
      case "history":
        return "text-amber-200/90";
      default: // light
        return "text-blue-100/90";
    }
  };

  const getProverbColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-200/95";
      case "modern":
        return "text-cyan-200/95";
      case "history":
        return "text-amber-200/95";
      default: // light
        return "text-blue-50/95";
    }
  };

  const getStatIconColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-300";
      case "modern":
        return "text-indigo-300";
      case "history":
        return "text-amber-300";
      default: // light
        return "text-blue-200";
    }
  };

  const getStatLabelColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-200/80";
      case "modern":
        return "text-cyan-200/80";
      case "history":
        return "text-amber-200/80";
      default: // light
        return "text-blue-100/80";
    }
  };

  const getFeatureIconColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-300";
      case "modern":
        return "text-indigo-300";
      case "history":
        return "text-amber-300";
      default: // light
        return "text-blue-200";
    }
  };

  const getFeatureTextColor = () => {
    switch (currentTheme) {
      case "dark":
        return "text-purple-100/90";
      case "modern":
        return "text-cyan-100/90";
      case "history":
        return "text-amber-100/90";
      default: // light
        return "text-blue-50/90";
    }
  };

  const getBottomWaveGradient = () => {
    switch (currentTheme) {
      case "dark":
        return "bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent";
      case "modern":
        return "bg-gradient-to-t from-cyan-950 via-cyan-950/80 to-transparent";
      case "history":
        return "bg-gradient-to-t from-amber-50 via-amber-50/80 to-transparent";
      default: // light
        return "bg-gradient-to-t from-background via-background/80 to-transparent";
    }
  };

  return (
    <div
      className={`relative ${heightClasses[height]} overflow-hidden ${className} transition-colors duration-500`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={finalImageUrl}
          alt={title}
          fill
          className="object-cover transition-opacity duration-500"
          priority
          unoptimized
          quality={90}
        />

        {/* Dynamic Gradient Overlay */}
        <div
          className={`absolute inset-0 ${getOverlayGradient()} transition-all duration-500`}
        ></div>

        {/* Additional depth overlay */}
        <div
          className={`absolute inset-0 ${getDepthOverlay()} transition-opacity duration-500`}
        ></div>
      </div>

      {/* Magical Grid Pattern */}
      <MagicalGrid theme={currentTheme} />

      {/* Animated Light Orbs */}
      <LightOrbs theme={currentTheme} />

      {/* Floating Particles */}
      <FloatingParticles theme={currentTheme} />

      {/* Shimmer Effect */}
      <ShimmerEffect />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={controls}
            className="flex flex-col items-start space-y-6"
          >
            {/* Icon/Emoji */}
            {icon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-2"
              >
                {icon}
              </motion.div>
            )}

            {/* Title with gradient text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight ${getTitleGradient()} drop-shadow-2xl`}
            >
              {title}
            </motion.h1>

            {/* Description */}
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className={`text-lg sm:text-xl md:text-2xl lg:text-3xl ${getDescriptionColor()} drop-shadow-lg mb-2 max-w-4xl leading-relaxed font-medium`}
              >
                {description}
              </motion.p>
            )}

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className={`text-sm sm:text-base md:text-lg ${getSubtitleColor()} drop-shadow-md`}
              >
                {subtitle}
              </motion.p>
            )}

            {/* Proverb / Ca dao tục ngữ */}
            {proverb && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className={`text-base sm:text-lg md:text-xl italic ${getProverbColor()} drop-shadow-lg mt-2 max-w-3xl font-medium`}
              >
                "{proverb}"
              </motion.p>
            )}

            {/* Stats */}
            {stats && stats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-4xl"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                    className={`backdrop-blur-md ${
                      currentTheme === "dark"
                        ? "bg-white/10 border-white/20"
                        : currentTheme === "modern"
                        ? "bg-cyan-500/10 border-cyan-400/30"
                        : currentTheme === "history"
                        ? "bg-white/15 border-amber-200/30"
                        : "bg-white/20 border-white/30"
                    } border rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    {stat.icon && (
                      <div className={`mb-2 ${getStatIconColor()}`}>
                        {stat.icon}
                      </div>
                    )}
                    <div className="text-2xl font-bold mb-1 text-white">
                      {stat.value}
                    </div>
                    <div
                      className={`text-xs font-medium ${getStatLabelColor()}`}
                    >
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Features Grid - Integrated into Hero */}
            {features && features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="mt-8 w-full max-w-6xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                      className={`backdrop-blur-md ${
                        currentTheme === "dark"
                          ? "bg-white/15 border-white/30"
                          : currentTheme === "modern"
                          ? "bg-cyan-500/15 border-cyan-400/40"
                          : currentTheme === "history"
                          ? "bg-white/20 border-amber-200/40"
                          : "bg-white/25 border-white/40"
                      } border rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}
                    >
                      <div className={`mb-3 ${getFeatureIconColor()}`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white">
                        {feature.title}
                      </h3>
                      <p
                        className={`text-sm ${getFeatureTextColor()} leading-relaxed`}
                      >
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Custom Children Content */}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mt-6 w-full"
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Decorative bottom wave with gradient */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-20 ${getBottomWaveGradient()} pointer-events-none transition-colors duration-500`}
      ></div>
    </div>
  );
};

export default Hero;
