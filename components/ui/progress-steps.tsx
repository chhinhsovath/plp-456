"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressStepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export default function ProgressSteps({
  steps,
  currentStep,
  className,
}: ProgressStepsProps) {
  return (
    <div className={cn("w-full py-6 px-4", className)}>
      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" 
             style={{ marginLeft: '2rem', marginRight: '2rem' }} />
        
        {/* Active Progress Line */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600"
          style={{ marginLeft: '2rem' }}
          initial={{ width: 0 }}
          animate={{
            width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 4rem)`
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        
        {/* Steps */}
        <div className="relative flex items-start justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isUpcoming = index > currentStep;

            return (
              <motion.div
                key={index}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {/* Step Circle */}
                <motion.div
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm",
                    {
                      "bg-blue-600 text-white ring-4 ring-blue-100": isActive,
                      "bg-green-500 text-white": isCompleted,
                      "bg-white border-2 border-gray-300 text-gray-400": isUpcoming,
                    }
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  
                  {/* Active Pulse Effect */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-600"
                      animate={{
                        scale: [1, 1.3, 1.3],
                        opacity: [0.4, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </motion.div>
                
                {/* Step Label */}
                <motion.span
                  className={cn(
                    "mt-3 text-xs text-center font-medium px-2 py-1 rounded-md transition-colors duration-300",
                    {
                      "text-blue-700 bg-blue-50": isActive,
                      "text-green-700 bg-green-50": isCompleted,
                      "text-gray-500": isUpcoming,
                    }
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                >
                  {step}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}