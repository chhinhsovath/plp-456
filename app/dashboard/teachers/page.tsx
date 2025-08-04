"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";
import styles from "./teachers.module.css";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/users?role=TEACHER");
      if (response.ok) {
        const data = await response.json();
        // Handle both array and paginated response
        if (Array.isArray(data)) {
          setTeachers(data);
        } else if (data && Array.isArray(data.users)) {
          setTeachers(data.users);
        } else if (data && Array.isArray(data.data)) {
          setTeachers(data.data);
        } else {
          console.error("Unexpected response format:", data);
          setTeachers([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = Array.isArray(teachers)
    ? teachers.filter(
        (teacher: any) =>
          teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  if (loading) {
    return <div className={styles.loading}>{t("common.loading")}...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("navigation.teachers")}</h1>
        <button
          className={styles.addButton}
          onClick={() => router.push("/dashboard/teachers/new")}
        >
          + {t("teachers.addTeacher")}
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>{Array.isArray(teachers) ? teachers.length : 0}</h3>
          <p>{t("teachers.totalTeachers")}</p>
        </div>
        <div className={styles.statCard}>
          <h3>
            {Array.isArray(teachers)
              ? teachers.filter((t: any) => t.isActive).length
              : 0}
          </h3>
          <p>{t("teachers.activeTeachers")}</p>
        </div>
        <div className={styles.statCard}>
          <h3>0</h3>
          <p>{t("teachers.newThisMonth")}</p>
        </div>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder={t("teachers.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("teachers.school")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher: any) => (
              <tr key={teacher.id}>
                <td>{teacher.name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.schoolId || t("teachers.notAssigned")}</td>
                <td>
                  <span
                    className={`${styles.status} ${teacher.isActive ? styles.active : styles.inactive}`}
                  >
                    {teacher.isActive
                      ? t("common.active")
                      : t("common.inactive")}
                  </span>
                </td>
                <td>
                  <button
                    className={styles.actionButton}
                    onClick={() =>
                      router.push(`/dashboard/teachers/${teacher.id}`)
                    }
                  >
                    {t("common.view")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
