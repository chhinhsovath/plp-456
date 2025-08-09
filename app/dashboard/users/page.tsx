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
  const { t, language } = useTranslation();

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
    const confirmMessage = language === 'km' 
      ? "តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់នេះមែនទេ?" 
      : "Are you sure you want to delete this user?";
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        const errorMessage = language === 'km' 
          ? "មិនអាចលុបអ្នកប្រើប្រាស់បានទេ" 
          : "Failed to delete user";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = language === 'km' 
        ? "មានបញ្ហាក្នុងការលុបអ្នកប្រើប្រាស់" 
        : "Failed to delete user";
      alert(errorMessage);
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

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      ADMIN: { km: "អ្នកគ្រប់គ្រង", en: "Admin" },
      TEACHER: { km: "គ្រូបង្រៀន", en: "Teacher" },
      OBSERVER: { km: "អ្នកសង្កេត", en: "Observer" },
    };
    
    const roleData = roleMap[role as keyof typeof roleMap] || { km: role, en: role };
    return {
      primary: language === 'km' ? roleData.km : roleData.en,
      secondary: language === 'km' ? roleData.en : roleData.km
    };
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
    return <div className={styles.loading}>
      {language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}
    </div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>
            {language === 'km' ? 'អ្នកប្រើប្រាស់' : 'Users'}
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            {language === 'km' ? 'Users' : 'អ្នកប្រើប្រាស់'}
          </p>
        </div>
        <button
          className={styles.addButton}
          onClick={() => router.push("/dashboard/users/new")}
        >
          + {language === 'km' ? 'បន្ថែមអ្នកប្រើប្រាស់' : 'Add User'}
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>{stats.total}</h3>
          <p style={{ marginBottom: '2px' }}>
            {language === 'km' ? 'អ្នកប្រើប្រាស់សរុប' : 'Total Users'}
          </p>
          <small style={{ color: '#999', fontSize: '11px' }}>
            {language === 'km' ? 'Total Users' : 'អ្នកប្រើប្រាស់សរុប'}
          </small>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.active}</h3>
          <p style={{ marginBottom: '2px' }}>
            {language === 'km' ? 'សកម្ម' : 'Active'}
          </p>
          <small style={{ color: '#999', fontSize: '11px' }}>
            {language === 'km' ? 'Active' : 'សកម្ម'}
          </small>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.byRole.ADMIN || 0}</h3>
          <p style={{ marginBottom: '2px' }}>
            {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Administrators'}
          </p>
          <small style={{ color: '#999', fontSize: '11px' }}>
            {language === 'km' ? 'Administrators' : 'អ្នកគ្រប់គ្រង'}
          </small>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.byRole.TEACHER || 0}</h3>
          <p style={{ marginBottom: '2px' }}>
            {language === 'km' ? 'គ្រូបង្រៀន' : 'Teachers'}
          </p>
          <small style={{ color: '#999', fontSize: '11px' }}>
            {language === 'km' ? 'Teachers' : 'គ្រូបង្រៀន'}
          </small>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder={language === 'km' 
              ? 'ស្វែងរកតាមឈ្មោះ ឬអ៊ីមែល...' 
              : 'Search by name or email...'}
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
              {language === 'km' ? 'គ្រប់តួនាទី' : 'All Roles'}
            </option>
            <option value="ADMIN">
              {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin'}
            </option>
            <option value="TEACHER">
              {language === 'km' ? 'គ្រូបង្រៀន' : 'Teacher'}
            </option>
            <option value="OBSERVER">
              {language === 'km' ? 'អ្នកសង្កេត' : 'Observer'}
            </option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <div>
                  <div>{language === 'km' ? 'ឈ្មោះ' : 'Name'}</div>
                  <small style={{ fontWeight: 'normal', color: '#999', fontSize: '11px' }}>
                    {language === 'km' ? 'Name' : 'ឈ្មោះ'}
                  </small>
                </div>
              </th>
              <th>
                <div>
                  <div>{language === 'km' ? 'អ៊ីមែល' : 'Email'}</div>
                  <small style={{ fontWeight: 'normal', color: '#999', fontSize: '11px' }}>
                    {language === 'km' ? 'Email' : 'អ៊ីមែល'}
                  </small>
                </div>
              </th>
              <th>
                <div>
                  <div>{language === 'km' ? 'តួនាទី' : 'Role'}</div>
                  <small style={{ fontWeight: 'normal', color: '#999', fontSize: '11px' }}>
                    {language === 'km' ? 'Role' : 'តួនាទី'}
                  </small>
                </div>
              </th>
              <th>
                <div>
                  <div>{language === 'km' ? 'ស្ថានភាព' : 'Status'}</div>
                  <small style={{ fontWeight: 'normal', color: '#999', fontSize: '11px' }}>
                    {language === 'km' ? 'Status' : 'ស្ថានភាព'}
                  </small>
                </div>
              </th>
              <th>
                <div>
                  <div>{language === 'km' ? 'កាលបរិច្ឆេទបង្កើត' : 'Created Date'}</div>
                  <small style={{ fontWeight: 'normal', color: '#999', fontSize: '11px' }}>
                    {language === 'km' ? 'Created Date' : 'កាលបរិច្ឆេទបង្កើត'}
                  </small>
                </div>
              </th>
              <th>
                <div>
                  <div>{language === 'km' ? 'សកម្មភាព' : 'Actions'}</div>
                  <small style={{ fontWeight: 'normal', color: '#999', fontSize: '11px' }}>
                    {language === 'km' ? 'Actions' : 'សកម្មភាព'}
                  </small>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  {language === 'km' 
                    ? 'មិនមានទិន្នន័យ' 
                    : 'No data available'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const roleDisplay = getRoleDisplay(user.role);
                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`${styles.role} ${getRoleColor(user.role)}`}
                        title={roleDisplay.secondary}
                      >
                        <div>{roleDisplay.primary}</div>
                        <small style={{ fontSize: '10px', opacity: 0.8 }}>
                          {roleDisplay.secondary}
                        </small>
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}
                      >
                        <div>
                          {user.isActive
                            ? (language === 'km' ? 'សកម្ម' : 'Active')
                            : (language === 'km' ? 'អសកម្ម' : 'Inactive')}
                        </div>
                        <small style={{ fontSize: '10px', opacity: 0.8 }}>
                          {user.isActive
                            ? (language === 'km' ? 'Active' : 'សកម្ម')
                            : (language === 'km' ? 'Inactive' : 'អសកម្ម')}
                        </small>
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
                          title={language === 'km' ? 'View' : 'មើល'}
                        >
                          {language === 'km' ? 'មើល' : 'View'}
                        </button>
                        <button
                          className={styles.editButton}
                          onClick={() =>
                            router.push(`/dashboard/users/${user.id}/edit`)
                          }
                          title={language === 'km' ? 'Edit' : 'កែប្រែ'}
                        >
                          {language === 'km' ? 'កែប្រែ' : 'Edit'}
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteUser(user.id)}
                          title={language === 'km' ? 'Delete' : 'លុប'}
                        >
                          {language === 'km' ? 'លុប' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}