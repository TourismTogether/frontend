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
}

// Magical Grid Pattern Component
const MagicalGrid: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const gridLines = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 opacity-30 dark:opacity-20">
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
              stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
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
const LightOrbs: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const orbs = [
    { x: "10%", y: "20%", delay: 0, size: 200 },
    { x: "80%", y: "30%", delay: 0.5, size: 150 },
    { x: "50%", y: "70%", delay: 1, size: 180 },
    { x: "20%", y: "80%", delay: 1.5, size: 120 },
    { x: "90%", y: "60%", delay: 2, size: 160 },
  ];

  return (
    <>
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${
            isDark
              ? "bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30"
              : "bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20"
          }`}
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
const FloatingParticles: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute w-1 h-1 rounded-full ${
            isDark ? "bg-white/40" : "bg-black/20"
          }`}
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
  imageKeyword = "travel adventure",
  imageUrl,
  height = "medium",
  icon,
  children,
  className = "",
  stats,
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === "dark";
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

  const finalImageUrl =
    imageUrl || getTravelImageUrl(imageKeyword, 1920, 800);

  // Dynamic gradient based on theme
  const overlayGradient = isDark
    ? "bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-800/80"
    : "bg-gradient-to-br from-blue-600/70 via-purple-600/60 to-pink-600/70";

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
        <div className={`absolute inset-0 ${overlayGradient} transition-all duration-500`}></div>
        
        {/* Additional depth overlay */}
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-t from-black/60 via-transparent to-transparent"
              : "bg-gradient-to-t from-black/40 via-transparent to-transparent"
          } transition-opacity duration-500`}
        ></div>
      </div>

      {/* Magical Grid Pattern */}
      <MagicalGrid isDark={isDark} />

      {/* Animated Light Orbs */}
      <LightOrbs isDark={isDark} />

      {/* Floating Particles */}
      <FloatingParticles isDark={isDark} />

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
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight ${
                isDark
                  ? "bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
              } drop-shadow-2xl`}
            >
              {title}
            </motion.h1>

            {/* Description */}
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className={`text-lg sm:text-xl md:text-2xl lg:text-3xl ${
                  isDark ? "text-purple-100" : "text-blue-50"
                } drop-shadow-lg mb-2 max-w-4xl leading-relaxed font-medium`}
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
                className={`text-sm sm:text-base md:text-lg ${
                  isDark ? "text-purple-200/90" : "text-blue-100/90"
                } drop-shadow-md`}
              >
                {subtitle}
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
                      isDark
                        ? "bg-white/10 border-white/20"
                        : "bg-white/20 border-white/30"
                    } border rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    {stat.icon && (
                      <div
                        className={`mb-2 ${
                          isDark ? "text-purple-300" : "text-blue-200"
                        }`}
                      >
                        {stat.icon}
                      </div>
                    )}
                    <div
                      className={`text-2xl font-bold mb-1 ${
                        isDark ? "text-white" : "text-white"
                      }`}
                    >
                      {stat.value}
                    </div>
                    <div
                      className={`text-xs font-medium ${
                        isDark ? "text-purple-200/80" : "text-blue-100/80"
                      }`}
                    >
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
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
        className={`absolute bottom-0 left-0 right-0 h-20 ${
          isDark
            ? "bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"
            : "bg-gradient-to-t from-background via-background/80 to-transparent"
        } pointer-events-none transition-colors duration-500`}
      ></div>
    </div>
  );
};

export default Hero;
