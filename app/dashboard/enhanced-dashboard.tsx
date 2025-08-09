"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/translations";
import StatCard from "@/components/ui/stat-card";
import FadeIn from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function EnhancedDashboard() {
  const { t, language } = useTranslation();
  
  const stats = [
    {
      title: t("dashboard.totalTeachers"),
      value: 156,
      icon: "👤",
      color: "#1890ff",
      trend: "+12%",
    },
    {
      title: t("dashboard.activeMentorships"),
      value: 48,
      icon: "👥",
      color: "#52c41a",
      trend: "+8%",
    },
    {
      title: t("dashboard.totalObservations"),
      value: 324,
      icon: "📄",
      color: "#faad14",
      trend: "+23%",
    },
    {
      title: t("dashboard.completed"),
      value: 89,
      icon: "✅",
      color: "#13c2c2",
      trend: "+15%",
    },
  ];

  const activities = [
    {
      icon: "📝",
      title: t("dashboard.newObservationCompleted"),
      time: t("dashboard.twoHoursAgo"),
      color: "#1890ff"
    },
    {
      icon: "👥",
      title: t("dashboard.mentorshipScheduled"),
      time: t("dashboard.fiveHoursAgo"),
      color: "#52c41a"
    },
    {
      icon: "✅",
      title: t("dashboard.evaluationApproved"),
      time: t("dashboard.oneDayAgo"),
      color: "#faad14"
    },
  ];

  const performanceData = [
    { label: t("dashboard.teachingQuality"), value: 85, color: "#1890ff" },
    { label: t("dashboard.studentEngagement"), value: 78, color: "#52c41a" },
    { label: t("dashboard.lessonPlanning"), value: 92, color: "#faad14" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <FadeIn>
          <motion.h1 
            className="text-3xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t("navigation.dashboard")}
          </motion.h1>
        </FadeIn>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              delay={index * 0.1}
            />
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <FadeIn delay={0.4}>
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("dashboard.recentActivities")}
              </h3>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${activity.color}20` }}
                      whileHover={{ rotate: 5 }}
                    >
                      {activity.icon}
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </FadeIn>

          {/* Performance */}
          <FadeIn delay={0.5}>
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {t("dashboard.performance")}
              </h3>
              <div className="space-y-6">
                {performanceData.map((item, index) => (
                  <motion.div
                    key={index}
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold" style={{ color: item.color }}>
                        {item.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </FadeIn>
        </div>

        {/* Quick Actions */}
        <FadeIn delay={0.6}>
          <motion.div 
            className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
            whileHover={{ scale: 1.01 }}
          >
            <h3 className="text-xl font-semibold mb-4">
              {language === 'km' ? 'សកម្មភាពរហ័ស' : 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  icon: "📝", 
                  titleKm: "អង្កេតថ្មី", 
                  titleEn: "New Observation", 
                  href: "/dashboard/observations/select" 
                },
                { 
                  icon: "👥", 
                  titleKm: "មើលគ្រូបង្រៀន", 
                  titleEn: "View Teachers", 
                  href: "/dashboard/teachers" 
                },
                { 
                  icon: "📊", 
                  titleKm: "ការវិភាគ", 
                  titleEn: "Analytics", 
                  href: "/dashboard/analytics" 
                },
              ].map((action, index) => (
                <motion.a
                  key={index}
                  href={action.href}
                  className="flex flex-col items-start gap-2 p-4 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors no-underline text-white"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl mb-1">{action.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base leading-tight">
                      {language === 'km' ? action.titleKm : action.titleEn}
                    </span>
                    <span className="text-sm opacity-80 leading-tight">
                      {language === 'km' ? action.titleEn : action.titleKm}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </div>
  );
}