"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";
import { useSession } from "@/hooks/useSession";

interface MenuItem {
  id: string;
  labelKm: string;
  labelEn: string;
  icon: string;
  href: string;
  children?: MenuItem[];
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    labelKm: "ផ្ទាំងគ្រប់គ្រង",
    labelEn: "Dashboard",
    icon: "🏠",
    href: "/dashboard",
  },
  {
    id: "observations",
    labelKm: "ការអង្កេត",
    labelEn: "Observations",
    icon: "📋",
    href: "/dashboard/observations",
    badge: 5,
    children: [
      {
        id: "new-obs",
        labelKm: "អង្កេតថ្មី",
        labelEn: "New Observation",
        icon: "➕",
        href: "/dashboard/observations/select",
      },
      {
        id: "list-obs",
        labelKm: "បញ្ជីអង្កេត",
        labelEn: "List Observations",
        icon: "📃",
        href: "/dashboard/observations",
      },
      {
        id: "grade-4",
        labelKm: "ថ្នាក់ទី៤",
        labelEn: "Grade 4",
        icon: "4️⃣",
        href: "/dashboard/observations/grade-4",
      },
      {
        id: "grade-5",
        labelKm: "ថ្នាក់ទី៥",
        labelEn: "Grade 5",
        icon: "5️⃣",
        href: "/dashboard/observations/grade-5",
      },
      {
        id: "grade-6",
        labelKm: "ថ្នាក់ទី៦",
        labelEn: "Grade 6",
        icon: "6️⃣",
        href: "/dashboard/observations/grade-6",
      },
    ],
  },
  {
    id: "teachers",
    labelKm: "គ្រូបង្រៀន",
    labelEn: "Teachers",
    icon: "👨‍🏫",
    href: "/dashboard/teachers",
    badge: 156,
  },
  {
    id: "users",
    labelKm: "អ្នកប្រើប្រាស់",
    labelEn: "Users",
    icon: "👥",
    href: "/dashboard/users",
  },
  {
    id: "evaluations",
    labelKm: "ការវាយតម្លៃ",
    labelEn: "Evaluations",
    icon: "📊",
    href: "/dashboard/evaluations",
  },
  {
    id: "settings",
    labelKm: "ការកំណត់",
    labelEn: "Settings",
    icon: "⚙️",
    href: "/dashboard/settings",
  },
];

export default function AnimatedSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useTranslation();
  const { data: user } = useSession();

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: MenuItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some((child) => isActive(child.href)) || false;
  };

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

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <motion.div
      className="h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white shadow-2xl flex flex-col overflow-hidden"
      variants={sidebarVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      initial="expanded"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <motion.div
        className="p-4 border-b border-white/10 flex items-center justify-between"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">🎓</span>
              </motion.div>
              <div>
                <h2 className="font-bold text-lg">MENTOR</h2>
                <p className="text-xs text-white/70">
                  {language === "km" ? "ប្រព័ន្ធគ្រប់គ្រង" : "Management System"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isCollapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"}
            />
          </motion.svg>
        </motion.button>
      </motion.div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
          >
            <motion.div
              className={cn(
                "mx-2 mb-1 rounded-lg transition-all cursor-pointer",
                isParentActive(item)
                  ? "bg-white/20 shadow-lg"
                  : "hover:bg-white/10"
              )}
              whileHover={{ x: 4 }}
              onClick={() => {
                if (item.children) {
                  toggleExpand(item.id);
                } else {
                  router.push(item.href);
                }
              }}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    className="text-xl"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    {item.icon}
                  </motion.span>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {language === "km" ? item.labelKm : item.labelEn}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <>
                      {item.badge && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded-full"
                        >
                          {item.badge}
                        </motion.span>
                      )}
                      {item.children && (
                        <motion.svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={{
                            rotate: expandedItems.includes(item.id) ? 90 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </motion.svg>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Submenu */}
            <AnimatePresence>
              {item.children &&
                expandedItems.includes(item.id) &&
                !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-4"
                  >
                    {item.children.map((child, childIndex) => (
                      <motion.div
                        key={child.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ delay: childIndex * 0.05 }}
                        className={cn(
                          "mx-2 mb-1 rounded-lg cursor-pointer",
                          isActive(child.href)
                            ? "bg-white/15"
                            : "hover:bg-white/5"
                        )}
                        onClick={() => router.push(child.href)}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-2 p-2 pl-4">
                          <span className="text-sm">{child.icon}</span>
                          <span className="text-sm">
                            {language === "km" ? child.labelKm : child.labelEn}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Footer - Profile & Logout */}
      <motion.div
        className="p-4 border-t border-white/10"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                {getUserInitials()}
              </motion.div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-white/70">{user?.email || ''}</p>
              </div>
              <motion.button
                className="p-2 rounded-lg hover:bg-white/10 group"
                onClick={handleLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={language === "km" ? "ចាកចេញ" : "Logout"}
              >
                <motion.span 
                  className="inline-block"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  🚪
                </motion.span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-white/10"
              onClick={handleLogout}
              whileHover={{ scale: 1.1 }}
              title={language === "km" ? "ចាកចេញ" : "Logout"}
            >
              <span className="text-xl">🚪</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}