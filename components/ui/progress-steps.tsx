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
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                    {
                      "bg-blue-600 border-blue-600 text-white": isActive,
                      "bg-green-500 border-green-500 text-white": isCompleted,
                      "bg-gray-100 border-gray-300 text-gray-500": isUpcoming,
                    }
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {isCompleted ? (
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <motion.span
                  className={cn(
                    "mt-2 text-xs text-center max-w-20 leading-tight",
                    {
                      "text-blue-600 font-medium": isActive,
                      "text-green-600 font-medium": isCompleted,
                      "text-gray-500": isUpcoming,
                    }
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                >
                  {step}
                </motion.span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 mt-5">
                  <div className="relative h-0.5 bg-gray-200 rounded-full">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{
                        width: index < currentStep ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}