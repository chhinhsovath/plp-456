"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";
import { useSession } from "@/hooks/useSession";

interface NavbarProps {
  className?: string;
}

export default function AnimatedNavbar({ className }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();
  const { language, setLanguage } = useTranslation();
  const { data: user } = useSession();

  const notifications = [
    {
      id: 1,
      title: "New observation completed",
      titleKm: "ការអង្កេតថ្មីបានបញ្ចប់",
      time: "2 hours ago",
      icon: "📝",
      unread: true,
    },
    {
      id: 2,
      title: "Teacher evaluation pending",
      titleKm: "ការវាយតម្លៃគ្រូកំពុងរង់ចាំ",
      time: "5 hours ago",
      icon: "⏳",
      unread: true,
    },
    {
      id: 3,
      title: "Monthly report available",
      titleKm: "របាយការណ៍ប្រចាំខែអាចប្រើបាន",
      time: "1 day ago",
      icon: "📊",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user initials for profile badge
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  return (
    <motion.nav
      className={cn(
        "bg-white shadow-md border-b border-gray-200 sticky top-0 z-40",
        className
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Mobile Menu & Search */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div className="w-6 h-5 flex flex-col justify-between">
                <motion.span
                  className="w-full h-0.5 bg-gray-600 rounded"
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 8 : 0,
                  }}
                />
                <motion.span
                  className="w-full h-0.5 bg-gray-600 rounded"
                  animate={{
                    opacity: isMobileMenuOpen ? 0 : 1,
                  }}
                />
                <motion.span
                  className="w-full h-0.5 bg-gray-600 rounded"
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? -8 : 0,
                  }}
                />
              </motion.div>
            </motion.button>

            {/* Search Bar */}
            <motion.div
              className="relative hidden md:block"
              initial={{ width: 200 }}
              whileFocus={{ width: 300 }}
            >
              <motion.input
                type="text"
                placeholder={language === "km" ? "ស្វែងរក..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ scale: 1.1 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </motion.svg>
            </motion.div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <motion.button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              onClick={() => setLanguage(language === "km" ? "en" : "km")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                key={language}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-sm font-medium"
              >
                {language === "km" ? "🇰🇭 KM" : "🇬🇧 EN"}
              </motion.span>
            </motion.button>

            {/* Notifications */}
            <motion.div className="relative">
              <motion.button
                className="relative p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setShowNotifications(!showNotifications)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={showNotifications ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </motion.svg>
                {unreadCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <h3 className="font-semibold">
                        {language === "km" ? "ការជូនដំណឹង" : "Notifications"}
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif, index) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100",
                            notif.unread && "bg-blue-50"
                          )}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{notif.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {language === "km" ? notif.titleKm : notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notif.time}
                              </p>
                            </div>
                            {notif.unread && (
                              <motion.div
                                className="w-2 h-2 bg-blue-500 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <motion.div
                      className="p-3 text-center border-t border-gray-200"
                      whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    >
                      <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
                        {language === "km" ? "មើលទាំងអស់" : "View all"}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Quick Actions */}
            <motion.button
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
              onClick={() => router.push("/dashboard/observations/new")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                ➕
              </motion.span>
              <span className="text-sm font-medium">
                {language === "km" ? "អង្កេតថ្មី" : "New Observation"}
              </span>
            </motion.button>

            {/* Profile Menu */}
            <motion.div
              className="relative hidden md:block"
            >
              <motion.button
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <motion.svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: showProfileMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                  >
                    {/* Profile Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-semibold text-lg">
                          {getUserInitials()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{user?.name || 'User'}</p>
                          <p className="text-sm opacity-90">{user?.email || ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <motion.button
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                        onClick={() => {
                          router.push('/dashboard/profile');
                          setShowProfileMenu(false);
                        }}
                        whileHover={{ x: 4 }}
                      >
                        <span className="text-lg">👤</span>
                        <span className="text-sm font-medium text-gray-700">
                          {language === "km" ? "ប្រវត្តិរូប" : "Profile"}
                        </span>
                      </motion.button>

                      <motion.button
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                        onClick={() => {
                          router.push('/dashboard/settings');
                          setShowProfileMenu(false);
                        }}
                        whileHover={{ x: 4 }}
                      >
                        <span className="text-lg">⚙️</span>
                        <span className="text-sm font-medium text-gray-700">
                          {language === "km" ? "ការកំណត់" : "Settings"}
                        </span>
                      </motion.button>

                      <div className="my-2 border-t border-gray-200"></div>

                      <motion.button
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-left"
                        onClick={handleLogout}
                        whileHover={{ x: 4 }}
                      >
                        <span className="text-lg">🚪</span>
                        <span className="text-sm font-medium text-red-600">
                          {language === "km" ? "ចាកចេញ" : "Logout"}
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-3 space-y-2">
              <motion.input
                type="text"
                placeholder={language === "km" ? "ស្វែងរក..." : "Search..."}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-left"
                onClick={() => {
                  router.push("/dashboard/observations/new");
                  setIsMobileMenuOpen(false);
                }}
                whileTap={{ scale: 0.98 }}
              >
                {language === "km" ? "➕ អង្កេតថ្មី" : "➕ New Observation"}
              </motion.button>
              
              {/* Mobile Profile Section */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="px-4 py-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getUserInitials()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
                <motion.button
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
                  onClick={handleLogout}
                  whileTap={{ scale: 0.98 }}
                >
                  🚪 {language === "km" ? "ចាកចេញ" : "Logout"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}