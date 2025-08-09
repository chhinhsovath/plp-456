"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

const directions = {
  up: { y: 20, x: 0 },
  down: { y: -20, x: 0 },
  left: { y: 0, x: 20 },
  right: { y: 0, x: -20 },
};

export default function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className,
}: FadeInProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: 0 
      }}
      transition={{ 
        duration, 
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}