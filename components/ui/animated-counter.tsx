"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  from = 0,
  to,
  duration = 1,
  className,
}: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const controls = animate(count, to, {
      duration,
      ease: "easeOut",
    });

    return controls.stop;
  }, [count, to, duration]);

  useEffect(() => {
    const unsubscribe = rounded.onChange((latest) => setDisplayValue(latest));
    return unsubscribe;
  }, [rounded]);

  return (
    <motion.span
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  );
}