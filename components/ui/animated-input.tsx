"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, helperText, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    return (
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <motion.label
            className={cn(
              "absolute left-3 px-1 bg-white transition-all duration-200 pointer-events-none",
              isFocused || hasValue || props.value
                ? "text-xs -top-2.5 text-blue-600"
                : "text-sm top-3 text-gray-500"
            )}
            animate={{
              y: isFocused || hasValue || props.value ? -12 : 0,
              scale: isFocused || hasValue || props.value ? 0.85 : 1,
            }}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {icon && (
            <motion.div
              className="absolute left-3 top-3 text-gray-400"
              animate={{ color: isFocused ? "#2563eb" : "#9ca3af" }}
            >
              {icon}
            </motion.div>
          )}
          
          <motion.input
            ref={ref}
            className={cn(
              "w-full px-3 py-3 border rounded-lg outline-none transition-all",
              icon && "pl-10",
              error ? "border-red-500" : "border-gray-300",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            whileFocus={{ scale: 1.01 }}
            animate={{
              borderColor: error ? "#ef4444" : isFocused ? "#3b82f6" : "#d1d5db",
            }}
            {...props}
          />
        </div>

        {error && (
          <motion.p
            className="mt-1 text-xs text-red-500"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
        
        {helperText && !error && (
          <motion.p
            className="mt-1 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {helperText}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

interface AnimatedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const AnimatedSelect = React.forwardRef<HTMLSelectElement, AnimatedSelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <motion.label
            className={cn(
              "absolute left-3 px-1 bg-white transition-all duration-200 pointer-events-none z-10",
              props.value ? "text-xs -top-2.5 text-blue-600" : "text-sm top-3 text-gray-500"
            )}
            animate={{
              y: props.value ? -12 : 0,
              scale: props.value ? 0.85 : 1,
            }}
          >
            {label}
          </motion.label>
        )}
        
        <motion.select
          ref={ref}
          className={cn(
            "w-full px-3 py-3 border rounded-lg outline-none transition-all appearance-none bg-white",
            error ? "border-red-500" : "border-gray-300",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          animate={{
            borderColor: error ? "#ef4444" : isFocused ? "#3b82f6" : "#d1d5db",
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>
        
        <motion.div
          className="absolute right-3 top-3 pointer-events-none"
          animate={{ rotate: isFocused ? 180 : 0 }}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>

        {error && (
          <motion.p
            className="mt-1 text-xs text-red-500"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

AnimatedSelect.displayName = "AnimatedSelect";

interface AnimatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const AnimatedTextarea = React.forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    return (
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <motion.label
            className={cn(
              "absolute left-3 px-1 bg-white transition-all duration-200 pointer-events-none",
              isFocused || hasValue || props.value
                ? "text-xs -top-2.5 text-blue-600"
                : "text-sm top-3 text-gray-500"
            )}
            animate={{
              y: isFocused || hasValue || props.value ? -12 : 0,
              scale: isFocused || hasValue || props.value ? 0.85 : 1,
            }}
          >
            {label}
          </motion.label>
        )}
        
        <motion.textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-3 border rounded-lg outline-none transition-all resize-none",
            error ? "border-red-500" : "border-gray-300",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          whileFocus={{ scale: 1.01 }}
          animate={{
            borderColor: error ? "#ef4444" : isFocused ? "#3b82f6" : "#d1d5db",
          }}
          {...props}
        />

        {error && (
          <motion.p
            className="mt-1 text-xs text-red-500"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
        
        {helperText && !error && (
          <motion.p
            className="mt-1 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {helperText}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

AnimatedTextarea.displayName = "AnimatedTextarea";