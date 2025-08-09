'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import AIAnalysis from '@/components/ai/AIAnalysis';
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
  const { t, language } = useTranslation();
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
          <h1>{t('observations.viewObservation')}</h1>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/dashboard/observations')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginRight: '10px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5a6268';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6c757d';
            }}
          >
            ← {language === 'km' ? 'បញ្ជីអង្កេត' : 'Observations List'}
          </button>
          <button className={styles.printButton} onClick={handlePrint}>
            🖨️ {t('common.print')}
          </button>
          <button className={styles.editButton} onClick={handleEdit}>
            ✏️ {t('common.edit')}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>{t('forms.basicInfo')}</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>{t('observations.teacher')}:</label>
              <span>{observation.nameOfTeacher || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>{t('forms.inspectorName')}:</label>
              <span>{observation.inspectorName || observation.user?.name || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>{t('common.date')}:</label>
              <span>{observation.inspectionDate ? new Date(observation.inspectionDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>{t('common.time')}:</label>
              <span>{observation.startTime || 'N/A'} - {observation.endTime || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>{t('observations.school')}:</label>
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
              <label>{t('observations.totalStudents')}:</label>
              <span>{calculatePresentStudents()} {t('observations.present')} / {calculateTotalStudents()} {t('common.total')}</span>
            </div>
            <div className={styles.infoItem}>
              <label>{t('forms.locationInfo')}:</label>
              <span>
                {[observation.village, observation.commune, observation.district, observation.province]
                  .filter(Boolean)
                  .join(', ') || 'N/A'}
              </span>
            </div>
            {observation.cluster && (
              <div className={styles.infoItem}>
                <label>{t('forms.cluster')}:</label>
                <span>{observation.cluster}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>{t('observations.evaluationSummary')}</h2>
          {observation.evaluationRecords && observation.evaluationRecords.length > 0 ? (
            <div className={styles.evaluationList}>
              {(() => {
                // First sort by sequence, then group by level
                const sortedRecords = [...observation.evaluationRecords].sort((a: any, b: any) => 
                  (a.field?.indicatorSequence || 0) - (b.field?.indicatorSequence || 0)
                );
                
                // Group by level while maintaining sequence order
                const groupedByLevel = sortedRecords.reduce((acc: any, record: any) => {
                  const level = record.field?.evaluationLevel || 1;
                  if (!acc[level]) {
                    acc[level] = [];
                  }
                  acc[level].push(record);
                  return acc;
                }, {});
                
                // Get sorted levels
                const levels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));
                
                return levels.map(level => (
                  <div key={level} className={styles.levelSection}>
                    <h3 className={styles.levelHeader} style={{
                      color: level === '1' ? '#52c41a' : level === '2' ? '#1890ff' : '#fa8c16'
                    }}>
                      {t('evaluationLevels.level')} {level}
                    </h3>
                    {groupedByLevel[level].map((record: any, index: number) => (
                      <div key={record.id || index} className={styles.evaluationDetailItem}>
                        <div className={styles.indicatorNumber}>
                          {record.field?.indicatorSequence || index + 1}
                        </div>
                        <div className={styles.indicatorContent}>
                          <div className={styles.indicatorMain}>
                            {language === 'km' ? 
                              (record.field?.indicatorMain || record.field?.indicatorMainEn || 'Indicator') :
                              (record.field?.indicatorMainEn || record.field?.indicatorMain || 'Indicator')
                            }
                          </div>
                          {(record.field?.indicatorSub || record.field?.indicatorSubEn) && (
                            <div className={styles.indicatorSub}>
                              {language === 'km' ? 
                                (record.field?.indicatorSub || record.field?.indicatorSubEn) : 
                                (record.field?.indicatorSubEn || record.field?.indicatorSub)
                              }
                            </div>
                          )}
                        </div>
                        <div className={styles.scoreValue}>
                          <span className={`${styles.scoreLabel} ${styles[record.scoreValue]}`}>
                            {record.scoreValue === 'yes' ? t('forms.evaluationYes') : 
                             record.scoreValue === 'some_practice' ? t('forms.evaluationSomePractice') : 
                             record.scoreValue === 'no' ? t('forms.evaluationNo') : record.scoreValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
              <div className={styles.evaluationLevels}>
                <strong>{t('evaluationLevels.title')}: </strong>
                {observation.level ? `${t('evaluationLevels.level')} ${observation.level}` : 
                 observation.evaluationLevels ? observation.evaluationLevels.map(l => `${t('evaluationLevels.level')} ${l}`).join(', ') : 'N/A'}
              </div>
            </div>
          ) : (
            <div className={styles.noData}>{t('messages.noData')}</div>
          )}
        </div>

        {observation.studentAssessmentSessions && observation.studentAssessmentSessions.length > 0 && (() => {
          const session = observation.studentAssessmentSessions[0];
          return (
            <div className={styles.section}>
              <h2>{t('forms.studentAssessment')}</h2>
              <div className={styles.assessmentTable}>
                {session?.subjects && (
                  <table>
                    <thead>
                      <tr>
                        <th>{t('observations.student')}</th>
                        {session.subjects.map((subject: any) => (
                          <th key={subject.subjectId}>
                            {language === 'km' ? subject.subjectNameKm : subject.subjectNameEn}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {session.students && 
                       session.students.map((student: any) => (
                        <tr key={student.studentId}>
                          <td>
                            {student.studentName || student.studentIdentifier}
                            {student.studentGender && (
                              <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                                ({student.studentGender})
                              </span>
                            )}
                          </td>
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

        <div className={styles.section}>
          <h2>{language === 'km' ? '📝 សម្គាល់ការវាយតម្លៃ' : '📝 General Notes'}</h2>
          <div className={styles.notesSection} style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            minHeight: '100px'
          }}>
            {observation.generalNotes ? (
              <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {observation.generalNotes}
              </p>
            ) : (
              <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>
                {language === 'km' ? 'មិនមានសម្គាល់' : 'No notes provided'}
              </p>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className={styles.section}>
          <AIAnalysis 
            observationData={{
              ...observation,
              evaluationData: observation.evaluationRecords?.reduce((acc: any, record: any) => {
                if (record.field?.fieldId) {
                  acc[`field_${record.field.fieldId}`] = record.scoreValue;
                }
                return acc;
              }, {}) || {},
              masterFields: observation.evaluationRecords?.map((record: any) => ({
                id: record.field?.fieldId,
                indicator: record.field?.indicatorSub || record.field?.indicatorMain,
                indicator_sub: record.field?.indicatorSub,
                level: record.field?.evaluationLevel
              })) || []
            }} 
            language={language} 
          />
        </div>
      </div>
    </div>
  );
}