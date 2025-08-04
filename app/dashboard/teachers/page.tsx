'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './teachers.module.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=TEACHER');
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
          console.error('Unexpected response format:', data);
          setTeachers([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = Array.isArray(teachers) 
    ? teachers.filter((teacher: any) =>
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return <div className={styles.loading}>Loading teachers...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Teachers</h1>
        <button 
          className={styles.addButton}
          onClick={() => router.push('/dashboard/teachers/new')}
        >
          + Add Teacher
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>{Array.isArray(teachers) ? teachers.length : 0}</h3>
          <p>Total Teachers</p>
        </div>
        <div className={styles.statCard}>
          <h3>{Array.isArray(teachers) ? teachers.filter((t: any) => t.isActive).length : 0}</h3>
          <p>Active Teachers</p>
        </div>
        <div className={styles.statCard}>
          <h3>0</h3>
          <p>New This Month</p>
        </div>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>School</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher: any) => (
              <tr key={teacher.id}>
                <td>{teacher.name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.schoolId || 'Not assigned'}</td>
                <td>
                  <span className={`${styles.status} ${teacher.isActive ? styles.active : styles.inactive}`}>
                    {teacher.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className={styles.actionButton}
                    onClick={() => router.push(`/dashboard/teachers/${teacher.id}`)}
                  >
                    View
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