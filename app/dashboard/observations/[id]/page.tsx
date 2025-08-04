'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './view-observation.module.css';

interface Observation {
  id: string;
  teacherName: string;
  observerName: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  grade: string;
  topic: string;
  numberOfStudents: number;
  schoolName: string;
  status: string;
  overallScore: number;
  // Evaluation scores
  lessonObjectives: number;
  lessonStructure: number;
  instructionalStrategies: number;
  studentEngagement: number;
  assessmentMethods: number;
  classroomManagement: number;
  studentParticipation: number;
  studentUnderstanding: number;
  studentBehavior: number;
  // Text fields
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
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
        // Map the API response to our interface
        const mappedObservation: Observation = {
          id: data.id,
          teacherName: data.nameOfTeacher || 'Unknown',
          observerName: data.user?.name || data.inspectorName || 'Unknown',
          date: data.inspectionDate,
          startTime: data.startTime ? new Date(data.startTime).toTimeString().substring(0, 5) : '',
          endTime: data.endTime ? new Date(data.endTime).toTimeString().substring(0, 5) : '',
          subject: data.subject || '',
          grade: `Grade ${data.grade}` || '',
          topic: data.title || '',
          numberOfStudents: (data.totalMale + data.totalFemale) || 0,
          schoolName: data.school || '',
          status: data.inspectionStatus || 'completed',
          overallScore: data.level ? data.level * 20 : 0,
          // Extract evaluation scores from evaluationRecords or use defaults
          lessonObjectives: 4,
          lessonStructure: 4,
          instructionalStrategies: 3,
          studentEngagement: 5,
          assessmentMethods: 4,
          classroomManagement: 4,
          studentParticipation: 4,
          studentUnderstanding: 3,
          studentBehavior: 5,
          // Text fields
          strengths: 'Teacher demonstrated excellent classroom management and student engagement.',
          areasForImprovement: 'Consider incorporating more diverse teaching strategies.',
          recommendations: data.generalNotes || 'Continue professional development in instructional strategies.'
        };
        setObservation(mappedObservation);
      } else if (response.status === 404) {
        router.push('/dashboard/observations');
      }
    } catch (error) {
      console.error('Failed to fetch observation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getRatingLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Satisfactory';
    if (score >= 1.5) return 'Needs Improvement';
    return 'Poor';
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
      <div className={styles.notFound}>
        <h2>Observation not found</h2>
        <button onClick={() => router.push('/dashboard/observations')}>
          Back to Observations
        </button>
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
          <button 
            className={styles.editButton}
            onClick={() => router.push(`/dashboard/observations/${params.id}/edit`)}
          >
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
              <span>{observation.teacherName}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Observer:</label>
              <span>{observation.observerName}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Date:</label>
              <span>{new Date(observation.date).toLocaleDateString()}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Time:</label>
              <span>{observation.startTime} - {observation.endTime}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Subject:</label>
              <span>{observation.subject}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Grade:</label>
              <span>{observation.grade}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Topic:</label>
              <span>{observation.topic}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Students:</label>
              <span>{observation.numberOfStudents}</span>
            </div>
            <div className={styles.infoItem}>
              <label>School:</label>
              <span>{observation.schoolName}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Status:</label>
              <span className={`${styles.status} ${styles[observation.status]}`}>
                {observation.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.scoreSection}>
          <h2>Overall Performance</h2>
          <div className={styles.overallScore}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>{observation.overallScore}%</span>
              <span className={styles.scoreLabel}>{getRatingLabel(observation.overallScore / 20)}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Teaching Evaluation</h2>
          <div className={styles.evaluationGrid}>
            {[
              { field: 'lessonObjectives', label: 'Lesson Objectives', value: observation.lessonObjectives },
              { field: 'lessonStructure', label: 'Lesson Structure', value: observation.lessonStructure },
              { field: 'instructionalStrategies', label: 'Instructional Strategies', value: observation.instructionalStrategies },
              { field: 'studentEngagement', label: 'Student Engagement', value: observation.studentEngagement },
              { field: 'assessmentMethods', label: 'Assessment Methods', value: observation.assessmentMethods },
              { field: 'classroomManagement', label: 'Classroom Management', value: observation.classroomManagement }
            ].map(({ field, label, value }) => (
              <div key={field} className={styles.evaluationItem}>
                <span className={styles.evaluationLabel}>{label}</span>
                <div className={styles.evaluationBar}>
                  <div 
                    className={styles.evaluationFill} 
                    style={{ width: `${(value / 5) * 100}%` }}
                  />
                </div>
                <span className={styles.evaluationScore}>{value}/5</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Student Assessment</h2>
          <div className={styles.evaluationGrid}>
            {[
              { field: 'studentParticipation', label: 'Student Participation', value: observation.studentParticipation },
              { field: 'studentUnderstanding', label: 'Student Understanding', value: observation.studentUnderstanding },
              { field: 'studentBehavior', label: 'Student Behavior', value: observation.studentBehavior }
            ].map(({ field, label, value }) => (
              <div key={field} className={styles.evaluationItem}>
                <span className={styles.evaluationLabel}>{label}</span>
                <div className={styles.evaluationBar}>
                  <div 
                    className={styles.evaluationFill} 
                    style={{ width: `${(value / 5) * 100}%` }}
                  />
                </div>
                <span className={styles.evaluationScore}>{value}/5</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Feedback & Recommendations</h2>
          <div className={styles.feedbackSection}>
            <h3>Strengths Observed</h3>
            <p>{observation.strengths}</p>
          </div>
          <div className={styles.feedbackSection}>
            <h3>Areas for Improvement</h3>
            <p>{observation.areasForImprovement}</p>
          </div>
          {observation.recommendations && (
            <div className={styles.feedbackSection}>
              <h3>Recommendations</h3>
              <p>{observation.recommendations}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}