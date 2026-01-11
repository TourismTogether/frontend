"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useTheme } from "next-themes";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { COLORS } from "../../constants/colors";

interface FeatureIntroProps {
  title: string;
  description: string;
  features: Array<{
    icon?: React.ReactNode;
    title: string;
    description: string;
  }>;
  highlightColor?: string;
  className?: string;
}

// Animated background particles
const AnimatedParticles: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const particlesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    particlesRef.current.forEach((particle, index) => {
      if (!particle) return;

      gsap.to(particle, {
        x: `+=${Math.random() * 100 - 50}`,
        y: `+=${Math.random() * 100 - 50}`,
        opacity: Math.random() * 0.5 + 0.3,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2,
      });
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) particlesRef.current[i] = el;
          }}
          className={`absolute rounded-full ${
            isDark
              ? "bg-purple-400/20"
              : "bg-amber-400/20"
          }`}
          style={{
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

// Floating icon animation
const FloatingIcon: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
};

export const FeatureIntro: React.FC<FeatureIntroProps> = ({
  title,
  description,
  features,
  highlightColor,
  className = "",
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Animate container entrance
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out",
    });
  }, []);

  const gradientBg = isDark
    ? "bg-gradient-to-br from-slate-900/80 via-purple-900/40 to-slate-800/80"
    : "bg-gradient-to-br from-blue-50/80 via-purple-50/40 to-pink-50/80";

  const borderColor = isDark
    ? "border-purple-500/30"
    : "border-blue-300/50";

  const textGradient = isDark
    ? "bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300"
    : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600";

  return (
    <div
      ref={containerRef}
      className={`relative ${className} transition-all duration-500`}
    >
      <div
        className={`relative backdrop-blur-xl ${gradientBg} ${borderColor} border-2 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden transition-all duration-500`}
      >
        {/* Animated Particles Background */}
        <AnimatedParticles isDark={isDark} />

        {/* Shimmer Effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent ${
            isDark ? "via-white/5" : "via-white/10"
          }`}
          style={{ transform: "skewX(-20deg)" }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "linear",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <FloatingIcon>
                <Sparkles
                  className={`w-8 h-8 ${
                    isDark ? "text-purple-400" : "text-blue-500"
                  }`}
                />
              </FloatingIcon>
              <h2
                className={`text-3xl md:text-4xl lg:text-5xl font-extrabold ${textGradient} bg-clip-text text-transparent`}
              >
                {title}
              </h2>
            </div>
            <p
              className={`text-lg md:text-xl ${
                isDark ? "text-purple-100/90" : "text-blue-600/90"
              } max-w-3xl mx-auto leading-relaxed`}
            >
              {description}
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.4 + index * 0.1,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 },
                }}
                className={`relative group ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10"
                    : "bg-white/40 hover:bg-white/60"
                } backdrop-blur-sm border ${
                  isDark ? "border-purple-500/20" : "border-blue-300/30"
                } rounded-2xl p-6 transition-all duration-300 cursor-pointer`}
              >
                {/* Feature Icon */}
                {feature.icon && (
                  <div
                    className={`mb-4 inline-flex p-3 rounded-xl ${
                      isDark
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-blue-500/20 text-blue-600"
                    } transition-colors duration-300`}
                  >
                    {feature.icon}
                  </div>
                )}

                {/* Feature Title */}
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  } transition-colors duration-300`}
                >
                  {feature.title}
                </h3>

                {/* Feature Description */}
                <p
                  className={`text-sm leading-relaxed ${
                    isDark ? "text-purple-200/80" : "text-gray-600"
                  } transition-colors duration-300`}
                >
                  {feature.description}
                </p>

                {/* Hover Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className={`absolute bottom-4 right-4 ${
                    isDark ? "text-purple-400" : "text-blue-500"
                  } transition-colors duration-300`}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>

                {/* Glow effect on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isDark
                      ? "bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10"
                      : "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
                  }`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureIntro;
