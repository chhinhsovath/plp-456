'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './view-observation.module.css';

interface Observation {
  id: string;
  // New structure from API
  nameOfTeacher?: string;
  inspectorName?: string;
  inspectionDate?: string;
  startTime?: string;
  endTime?: string;
  subject?: string;
  grade?: number;
  title?: string;
  school?: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  cluster?: string;
  totalMale?: number;
  totalFemale?: number;
  totalAbsent?: number;
  totalAbsentFemale?: number;
  level?: number;
  evaluationLevels?: number[];
  generalNotes?: string;
  status?: string;
  overallScore?: number;
  evaluationRecords?: Array<{
    id: string;
    scoreValue: string;
    notes?: string;
    field?: {
      fieldId: number;
      indicatorSequence: number;
      indicatorMain?: string;
      indicatorMainEn?: string;
      indicatorSub?: string;
      indicatorSubEn?: string;
    };
  }>;
  studentAssessmentSessions?: Array<{
    id: string;
    subjects?: Array<{
      subjectId: string;
      subjectNameEn: string;
      subjectNameKm: string;
      subjectOrder: number;
      maxScore: number;
    }>;
    students?: Array<{
      studentId: string;
      studentIdentifier: string;
      studentOrder: number;
      studentName?: string;
      studentGender?: string;
    }>;
    scores?: Array<{
      studentId: string;
      subjectId: string;
      score: number;
    }>;
  }>;
  user?: {
    id: number;
    name?: string;
    email?: string;
    role?: string;
  };
  [key: string]: any; // Allow additional fields
}

export default function ViewObservationPage() {
  const router = useRouter();
  const params = useParams();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObservation();
  }, [params.id]);

  const fetchObservation = async () => {
    try {
      const response = await fetch(`/api/observations/${params.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setObservation(data);
      } else {
        console.error('Failed to fetch observation');
        // Use fallback data if fetch fails
        setObservation(getFallbackData());
      }
    } catch (error) {
      console.error('Error fetching observation:', error);
      setObservation(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = (): Observation => ({
    id: params.id as string,
    nameOfTeacher: 'Sample Teacher',
    inspectorName: 'Sample Inspector',
    inspectionDate: new Date().toISOString(),
    subject: 'Mathematics',
    grade: 5,
    school: 'Sample School',
    generalNotes: 'Sample observation notes',
    evaluationRecords: [],
    studentAssessmentSessions: []
  });

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    router.push(`/dashboard/observations/${params.id}/edit`);
  };

  const getRatingLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Satisfactory';
    if (score >= 1.5) return 'Needs Improvement';
    return 'Poor';
  };

  const calculateOverallScore = () => {
    if (!observation?.evaluationRecords) return 0;
    const totalRecords = observation.evaluationRecords.length;
    if (totalRecords === 0) return 0;
    const yesCount = observation.evaluationRecords.filter(r => r.scoreValue === 'yes').length;
    return Math.round((yesCount / totalRecords) * 100);
  };

  const calculateTotalStudents = () => {
    if (!observation) return 0;
    return (observation.totalMale || 0) + (observation.totalFemale || 0);
  };

  const calculatePresentStudents = () => {
    if (!observation) return 0;
    return calculateTotalStudents() - (observation.totalAbsent || 0);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading observation...</p>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className={styles.container}>
        <p>Observation not found</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/dashboard/observations')}
          >
            ← Back to Observations
          </button>
          <h1>Observation Details</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.printButton} onClick={handlePrint}>
            🖨️ Print
          </button>
          <button className={styles.editButton} onClick={handleEdit}>
            ✏️ Edit
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Basic Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Teacher:</label>
              <span>{observation.nameOfTeacher || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Inspector:</label>
              <span>{observation.inspectorName || observation.user?.name || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Date:</label>
              <span>{observation.inspectionDate ? new Date(observation.inspectionDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Time:</label>
              <span>{observation.startTime || 'N/A'} - {observation.endTime || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>School:</label>
              <span>{observation.school || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Subject:</label>
              <span>{observation.subject || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Grade:</label>
              <span>{observation.grade ? `Grade ${observation.grade}` : 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Lesson:</label>
              <span>{observation.title || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Students:</label>
              <span>{calculatePresentStudents()} present / {calculateTotalStudents()} total</span>
            </div>
            <div className={styles.infoItem}>
              <label>Location:</label>
              <span>
                {[observation.village, observation.commune, observation.district, observation.province]
                  .filter(Boolean)
                  .join(', ') || 'N/A'}
              </span>
            </div>
            {observation.cluster && (
              <div className={styles.infoItem}>
                <label>Cluster:</label>
                <span>{observation.cluster}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Evaluation Summary</h2>
          {observation.evaluationRecords && observation.evaluationRecords.length > 0 ? (
            <div className={styles.evaluationList}>
              {observation.evaluationRecords.map((record: any, index: number) => (
                <div key={index} className={styles.evaluationDetailItem}>
                  <div className={styles.indicatorNumber}>
                    {record.field?.indicatorSequence || index + 1}
                  </div>
                  <div className={styles.indicatorContent}>
                    <div className={styles.indicatorMain}>
                      {record.field?.indicatorMain || record.field?.indicatorMainEn || 'Indicator'}
                    </div>
                    {(record.field?.indicatorSub || record.field?.indicatorSubEn) && (
                      <div className={styles.indicatorSub}>
                        {record.field?.indicatorSub || record.field?.indicatorSubEn}
                      </div>
                    )}
                  </div>
                  <div className={styles.scoreValue}>
                    <span className={`${styles.scoreLabel} ${styles[record.scoreValue]}`}>
                      {record.scoreValue === 'yes' ? 'Yes' : 
                       record.scoreValue === 'some_practice' ? 'Some Practice' : 
                       record.scoreValue === 'no' ? 'No' : record.scoreValue}
                    </span>
                  </div>
                </div>
              ))}
              <div className={styles.evaluationLevels}>
                <strong>Evaluation Levels: </strong>
                {observation.level ? `Level ${observation.level}` : 
                 observation.evaluationLevels ? observation.evaluationLevels.map(l => `Level ${l}`).join(', ') : 'N/A'}
              </div>
            </div>
          ) : (
            <div className={styles.noData}>No evaluation data available</div>
          )}
        </div>

        {observation.studentAssessmentSessions && observation.studentAssessmentSessions.length > 0 && (() => {
          const session = observation.studentAssessmentSessions[0];
          return (
            <div className={styles.section}>
              <h2>Student Assessment</h2>
              <div className={styles.assessmentTable}>
                {session?.subjects && (
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        {session.subjects.map((subject: any) => (
                          <th key={subject.subjectId}>
                            {subject.subjectNameEn}<br/>
                            <small>{subject.subjectNameKm}</small>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {session.students && 
                       session.students.map((student: any) => (
                        <tr key={student.studentId}>
                          <td>{student.studentIdentifier}</td>
                          {session.subjects?.map((subject: any) => {
                            const score = session.scores?.find(
                              (s: any) => s.studentId === student.studentId && s.subjectId === subject.subjectId
                            );
                            return (
                              <td key={subject.subjectId}>
                                {score ? `${score.score}/${subject.maxScore}` : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {observation.generalNotes && (
          <div className={styles.section}>
            <h2>General Notes</h2>
            <div className={styles.notesSection}>
              <p>{observation.generalNotes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}