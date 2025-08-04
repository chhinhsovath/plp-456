"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";
import styles from "./users.module.css";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  schoolId?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Handle both array and paginated response
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else if (data && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          console.error("Unexpected response format:", data);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t("messages.confirmDelete"))) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        alert(t("messages.deleteFailed"));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const matchesSearch =
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRole === "all" || user.role === filterRole;

        return matchesSearch && matchesRole;
      })
    : [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return styles.admin;
      case "TEACHER":
        return styles.teacher;
      case "OBSERVER":
        return styles.observer;
      default:
        return styles.default;
    }
  };

  const getUserStats = () => {
    if (!Array.isArray(users)) return { total: 0, active: 0, byRole: {} };

    const byRole = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      byRole,
    };
  };

  const stats = getUserStats();

  if (loading) {
    return <div className={styles.loading}>{t("common.loading")}...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t("navigation.users")}</h1>
        <button
          className={styles.addButton}
          onClick={() => router.push("/dashboard/users/new")}
        >
          + {t("users.addUser")}
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>{stats.total}</h3>
          <p>{t("users.totalUsers")}</p>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.active}</h3>
          <p>{t("users.activeUsers")}</p>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.byRole.ADMIN || 0}</h3>
          <p>{t("users.administrators")}</p>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.byRole.TEACHER || 0}</h3>
          <p>{t("navigation.teachers")}</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder={t("users.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.roleFilter}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">
              {t("common.all")} {t("users.roles.title")}
            </option>
            <option value="ADMIN">{t("users.roles.admin")}</option>
            <option value="TEACHER">{t("users.roles.teacher")}</option>
            <option value="OBSERVER">{t("users.roles.observer")}</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("users.role")}</th>
              <th>{t("common.status")}</th>
              <th>{t("users.created")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  {t("messages.noResults")}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`${styles.role} ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}
                    >
                      {user.isActive
                        ? t("common.active")
                        : t("common.inactive")}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() =>
                          router.push(`/dashboard/users/${user.id}`)
                        }
                      >
                        {t("common.view")}
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() =>
                          router.push(`/dashboard/users/${user.id}/edit`)
                        }
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
