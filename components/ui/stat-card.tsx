"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AnimatedCounter from "./animated-counter";

interface StatCardProps {
  title: string;
  value: number;
  icon?: string;
  trend?: string;
  color?: string;
  className?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = "#1890ff",
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, translateY: -2 }}
    >
      {/* Background gradient */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -mr-12 -mt-12"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <motion.p
            className="text-sm font-medium text-gray-600 mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
          >
            {title}
          </motion.p>
          
          <div className="flex items-baseline gap-2">
            <motion.div
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              <AnimatedCounter to={value} duration={1.5} />
            </motion.div>
            
            {trend && (
              <motion.span
                className="text-sm font-medium px-2 py-1 rounded-full"
                style={{ 
                  color,
                  backgroundColor: `${color}20`
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.4 }}
              >
                {trend}
              </motion.span>
            )}
          </div>
        </div>
        
        {icon && (
          <motion.div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${color}20` }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: delay + 0.1,
              type: "spring",
              stiffness: 200,
              damping: 10
            }}
          >
            {icon}
          </motion.div>
        )}
      </div>
      
      {/* Hover effect line */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: "0%" }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}