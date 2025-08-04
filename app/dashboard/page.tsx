"use client";

import { useTranslation } from "@/lib/translations";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { t } = useTranslation();
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

  return (
    <div className={styles.dashboard}>
      <h1>{t("navigation.dashboard")}</h1>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: stat.color + "20" }}
            >
              <span style={{ fontSize: "24px" }}>{stat.icon}</span>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statTitle}>{stat.title}</p>
              <h2 className={styles.statValue}>{stat.value}</h2>
              <span className={styles.statTrend} style={{ color: stat.color }}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <h3>{t("dashboard.recentActivities")}</h3>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>📝</span>
              <div>
                <p>{t("dashboard.newObservationCompleted")}</p>
                <small>{t("dashboard.twoHoursAgo")}</small>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>👥</span>
              <div>
                <p>{t("dashboard.mentorshipScheduled")}</p>
                <small>{t("dashboard.fiveHoursAgo")}</small>
              </div>
            </div>
            <div className={styles.activityItem}>
              <span className={styles.activityIcon}>✅</span>
              <div>
                <p>{t("dashboard.evaluationApproved")}</p>
                <small>{t("dashboard.oneDayAgo")}</small>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3>{t("dashboard.performance")}</h3>
          <div className={styles.performanceStats}>
            <div className={styles.performanceItem}>
              <p>{t("dashboard.teachingQuality")}</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: "85%" }}
                ></div>
              </div>
              <span>85%</span>
            </div>
            <div className={styles.performanceItem}>
              <p>{t("dashboard.studentEngagement")}</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: "78%" }}
                ></div>
              </div>
              <span>78%</span>
            </div>
            <div className={styles.performanceItem}>
              <p>{t("dashboard.lessonPlanning")}</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: "92%" }}
                ></div>
              </div>
              <span>92%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
