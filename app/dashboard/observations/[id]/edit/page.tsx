'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './edit-observation.module.css';

interface FormData {
  // Basic Session Info
  province: string;
  provinceCode: string;
  provinceNameKh: string;
  district: string;
  districtCode: string;
  districtNameKh: string;
  commune: string;
  communeCode: string;
  communeNameKh: string;
  village: string;
  villageCode: string;
  villageNameKh: string;
  cluster: string;
  school: string;
  schoolId: number;
  nameOfTeacher: string;
  sex: string;
  employmentType: string;
  sessionTime: string;
  subject: string;
  chapter: string;
  lesson: string;
  title: string;
  subTitle: string;
  inspectionDate: string;
  startTime: string;
  endTime: string;
  grade: number;
  totalMale: number;
  totalFemale: number;
  totalAbsent: number;
  totalAbsentFemale: number;
  inspectorName: string;
  inspectorPosition: string;
  inspectorOrganization: string;
  academicYear: string;
  semester: number;
  lessonDurationMinutes: number;
  generalNotes: string;
  
  // Teaching Evaluation - will store indicator scores
  evaluationData: { [key: string]: string };
  evaluationComments: { [key: string]: string };
  
  // Student Assessment
  studentAssessment: {
    subjects: Array<{ id?: string; name_km: string; name_en: string; order: number; max_score: number }>;
    students: Array<{ id?: string; identifier: string; order: number; name?: string; gender?: string }>;
    scores: { [key: string]: { [key: string]: number } };
  };
}

// Static data for dropdowns
const subjects = ['Mathematics', 'Khmer Language', 'Science', 'Social Studies', 'English', 'Physical Education'];
const employmentTypes = [
  { value: 'official', label: 'Official / មន្ត្រី' },
  { value: 'contract', label: 'Contract / កិច្ចសន្យា' },
  { value: 'volunteer', label: 'Volunteer / ស្ម័គ្រចិត្ត' }
];
const sessionTimes = [
  { value: 'morning', label: 'Morning / ព្រឹក' },
  { value: 'afternoon', label: 'Afternoon / រសៀល' },
  { value: 'full_day', label: 'Full Day / ពេញមួយថ្ងៃ' }
];

export default function EditObservationPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [observationId, setObservationId] = useState<string>('');
  
  const [formData, setFormData] = useState<FormData>({
    // Basic info
    province: '',
    provinceCode: '',
    provinceNameKh: '',
    district: '',
    districtCode: '',
    districtNameKh: '',
    commune: '',
    communeCode: '',
    communeNameKh: '',
    village: '',
    villageCode: '',
    villageNameKh: '',
    cluster: '',
    school: '',
    schoolId: 0,
    nameOfTeacher: '',
    sex: 'M',
    employmentType: 'official',
    sessionTime: 'morning',
    subject: '',
    chapter: '',
    lesson: '',
    title: '',
    subTitle: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    grade: 1,
    totalMale: 0,
    totalFemale: 0,
    totalAbsent: 0,
    totalAbsentFemale: 0,
    inspectorName: '',
    inspectorPosition: '',
    inspectorOrganization: '',
    academicYear: '2025',
    semester: 1,
    lessonDurationMinutes: 45,
    generalNotes: '',
    
    // Evaluation data
    evaluationData: {},
    evaluationComments: {},
    
    // Student assessment
    studentAssessment: {
      subjects: [
        { id: '1', name_km: 'អំណាន', name_en: 'Reading', order: 1, max_score: 100 },
        { id: '2', name_km: 'សរសេរ', name_en: 'Writing', order: 2, max_score: 100 },
        { id: '3', name_km: 'គណិតវិទ្យា', name_en: 'Mathematics', order: 3, max_score: 100 }
      ],
      students: Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        identifier: `សិស្សទី${i + 1}`,
        order: i + 1,
        name: '',
        gender: i % 2 === 0 ? 'M' : 'F'
      })),
      scores: {}
    }
  });

  const [evaluationIndicators, setEvaluationIndicators] = useState<any[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1]); // Default to level 1
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');

  // Fetch observation data on mount
  useEffect(() => {
    if (params.id) {
      setObservationId(params.id as string);
      fetchObservation();
    }
    fetchIndicators();
    fetchProvinces();
  }, [params.id]);

  const fetchObservation = async () => {
    try {
      const response = await fetch(`/api/observations/${params.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        
        // Map API response to form data
        const mappedData: FormData = {
          province: data.province || '',
          provinceCode: data.provinceCode || '',
          provinceNameKh: data.provinceNameKh || '',
          district: data.district || '',
          districtCode: data.districtCode || '',
          districtNameKh: data.districtNameKh || '',
          commune: data.commune || '',
          communeCode: data.communeCode || '',
          communeNameKh: data.communeNameKh || '',
          village: data.village || '',
          villageCode: data.villageCode || '',
          villageNameKh: data.villageNameKh || '',
          cluster: data.cluster || '',
          school: data.school || '',
          schoolId: data.schoolId || 0,
          nameOfTeacher: data.nameOfTeacher || '',
          sex: data.sex || 'M',
          employmentType: data.employmentType || 'official',
          sessionTime: data.sessionTime || 'morning',
          subject: data.subject || '',
          chapter: data.chapter || '',
          lesson: data.lesson || '',
          title: data.title || '',
          subTitle: data.subTitle || '',
          inspectionDate: data.inspectionDate ? new Date(data.inspectionDate).toISOString().split('T')[0] : '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          grade: data.grade || 1,
          totalMale: data.totalMale || 0,
          totalFemale: data.totalFemale || 0,
          totalAbsent: data.totalAbsent || 0,
          totalAbsentFemale: data.totalAbsentFemale || 0,
          inspectorName: data.inspectorName || data.user?.name || '',
          inspectorPosition: data.inspectorPosition || '',
          inspectorOrganization: data.inspectorOrganization || '',
          academicYear: data.academicYear || '2025',
          semester: data.semester || 1,
          lessonDurationMinutes: data.lessonDurationMinutes || 45,
          generalNotes: data.generalNotes || '',
          evaluationData: {},
          evaluationComments: {},
          studentAssessment: data.studentAssessment || {
            subjects: [
              { id: '1', name_km: 'អំណាន', name_en: 'Reading', order: 1, max_score: 100 },
              { id: '2', name_km: 'សរសេរ', name_en: 'Writing', order: 2, max_score: 100 },
              { id: '3', name_km: 'គណិតវិទ្យា', name_en: 'Mathematics', order: 3, max_score: 100 }
            ],
            students: Array.from({ length: 5 }, (_, i) => ({
              id: `${i + 1}`,
              identifier: `សិស្សទី${i + 1}`,
              order: i + 1,
              name: '',
              gender: i % 2 === 0 ? 'M' : 'F'
            })),
            scores: {}
          }
        };

        // Extract evaluation data from evaluationRecords
        if (data.evaluationRecords && Array.isArray(data.evaluationRecords)) {
          data.evaluationRecords.forEach((record: any) => {
            mappedData.evaluationData[`indicator_${record.fieldId}`] = record.scoreValue;
            if (record.aiContextComment) {
              mappedData.evaluationComments[`indicator_${record.fieldId}_comment`] = record.aiContextComment;
            }
          });
        }

        // Extract student assessment scores
        if (data.studentAssessmentSessions && data.studentAssessmentSessions.length > 0) {
          const session = data.studentAssessmentSessions[0];
          if (session.details && Array.isArray(session.details)) {
            session.details.forEach((detail: any) => {
              const subjectKey = `subject_${detail.subjectId}`;
              const studentKey = `student_${detail.studentIdentifier}`;
              if (!mappedData.studentAssessment.scores[subjectKey]) {
                mappedData.studentAssessment.scores[subjectKey] = {};
              }
              mappedData.studentAssessment.scores[subjectKey][studentKey] = detail.score;
            });
          }
        }

        setFormData(mappedData);

        // Set selected levels
        if (data.level) {
          setSelectedLevels([data.level]);
        } else if (data.evaluationLevels && Array.isArray(data.evaluationLevels)) {
          setSelectedLevels(data.evaluationLevels);
        }

        // Load location cascading data
        if (mappedData.provinceCode) {
          await fetchDistricts(mappedData.provinceCode);
        }
        if (mappedData.districtCode) {
          await fetchCommunes(mappedData.districtCode);
        }
        if (mappedData.communeCode) {
          await fetchVillages(mappedData.communeCode);
        }
        if (mappedData.provinceCode) {
          await searchSchools();
        }
      } else if (response.status === 404) {
        router.push('/dashboard/observations');
      }
    } catch (error) {
      console.error('Failed to fetch observation:', error);
      router.push('/dashboard/observations');
    } finally {
      setLoading(false);
    }
  };

  const fetchIndicators = async () => {
    try {
      const response = await fetch('/api/observations/indicators');
      if (response.ok) {
        const data = await response.json();
        setEvaluationIndicators(data);
      }
    } catch (error) {
      console.error('Failed to fetch indicators:', error);
    }
  };

  // Filter indicators by selected levels
  const filteredIndicators = evaluationIndicators.filter(
    indicator => selectedLevels.includes(indicator.evaluationLevel)
  );
  
  const fetchProvinces = async () => {
    try {
      const response = await fetch('/api/geographic/provinces');
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces || []);
      }
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  };
  
  const fetchDistricts = async (provinceCode: string) => {
    try {
      const response = await fetch(`/api/geographic/districts?provinceCode=${provinceCode}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.districts || []);
        setCommunes([]); // Reset communes when province changes
      } else {
        console.error('Failed to fetch districts:', response.status, await response.text());
        setDistricts([]);
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error);
      setDistricts([]);
    }
  };
  
  const fetchCommunes = async (districtCode: string) => {
    try {
      const response = await fetch(`/api/geographic/communes?districtCode=${districtCode}`);
      if (response.ok) {
        const data = await response.json();
        setCommunes(data.communes || []);
        setVillages([]); // Reset villages when district changes
      } else {
        console.error('Failed to fetch communes:', response.status, await response.text());
        setCommunes([]);
      }
    } catch (error) {
      console.error('Failed to fetch communes:', error);
      setCommunes([]);
    }
  };
  
  const fetchVillages = async (communeCode: string) => {
    try {
      const response = await fetch(`/api/geographic/villages?communeCode=${communeCode}`);
      if (response.ok) {
        const data = await response.json();
        setVillages(data.villages || []);
      }
    } catch (error) {
      console.error('Failed to fetch villages:', error);
    }
  };
  
  const searchSchools = useCallback(async () => {
    if (!formData.provinceCode) {
      setSchools([]);
      return;
    }
    
    try {
      const params = new URLSearchParams();
      params.append('provinceCode', formData.provinceCode);
      
      const response = await fetch(`/api/schools/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      } else {
        const errorText = await response.text();
        console.error('School search failed:', response.status, errorText);
        setSchools([]);
      }
    } catch (error) {
      console.error('Failed to search schools:', error);
      setSchools([]);
    }
  }, [formData.provinceCode]);
  
  // Trigger school search when province changes
  useEffect(() => {
    searchSchools();
  }, [searchSchools]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateEvaluationScore = (fieldId: number, score: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationData: {
        ...prev.evaluationData,
        [`indicator_${fieldId}`]: score
      }
    }));
  };

  const updateEvaluationComment = (fieldId: number, comment: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationComments: {
        ...prev.evaluationComments,
        [`indicator_${fieldId}_comment`]: comment
      }
    }));
  };

  const updateStudentScore = (subjectOrder: number, studentOrder: number, score: number) => {
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        scores: {
          ...prev.studentAssessment.scores,
          [`subject_${subjectOrder}`]: {
            ...prev.studentAssessment.scores[`subject_${subjectOrder}`],
            [`student_${studentOrder}`]: score
          }
        }
      }
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Prepare the data in the format expected by the API
      const payload = {
        sessionInfo: {
          sex: formData.sex,
          grade: formData.grade,
          title: formData.title,
          lesson: formData.lesson,
          school: formData.school,
          chapter: formData.chapter,
          commune: formData.commune,
          endTime: formData.endTime,
          subject: formData.subject,
          village: formData.village,
          district: formData.district,
          province: formData.province,
          schoolId: formData.schoolId,
          semester: formData.semester,
          subTitle: formData.subTitle,
          startTime: formData.startTime,
          totalMale: formData.totalMale,
          communeCode: formData.communeCode,
          sessionTime: formData.sessionTime,
          totalAbsent: formData.totalAbsent,
          totalFemale: formData.totalFemale,
          villageCode: formData.villageCode,
          academicYear: formData.academicYear,
          districtCode: formData.districtCode,
          generalNotes: formData.generalNotes,
          provinceCode: formData.provinceCode,
          communeNameKh: formData.communeNameKh,
          nameOfTeacher: formData.nameOfTeacher,
          villageNameKh: formData.villageNameKh,
          districtNameKh: formData.districtNameKh,
          employmentType: formData.employmentType,
          inspectionDate: formData.inspectionDate,
          provinceNameKh: formData.provinceNameKh,
          evaluationLevels: selectedLevels,
          totalAbsentFemale: formData.totalAbsentFemale,
          lessonDurationMinutes: formData.lessonDurationMinutes,
          ...formData.evaluationData,
          ...formData.evaluationComments
        },
        evaluationData: {
          ...formData.evaluationData,
          evaluationLevels: selectedLevels,
          ...formData.evaluationComments
        },
        studentAssessment: formData.studentAssessment
      };

      const response = await fetch(`/api/observations/${observationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        router.push(`/dashboard/observations/${observationId}`);
      } else {
        const error = await response.json();
        alert(error.details || 'Failed to update observation');
      }
    } catch (error) {
      console.error('Error updating observation:', error);
      alert('Failed to update observation');
    } finally {
      setSaving(false);
    }
  };

  const steps = ['Basic Information', 'Teaching Evaluation', 'Student Assessment', 'Review & Submit'];

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.province && formData.district && formData.school && 
               formData.nameOfTeacher && formData.subject && formData.grade;
      case 1:
        return selectedLevels.length > 0 && 
               Object.keys(formData.evaluationData).length >= filteredIndicators.length;
      case 2:
        return true; // Student assessment is optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  const calculateTotalStudents = () => {
    return formData.totalMale + formData.totalFemale;
  };

  const calculatePresentStudents = () => {
    return calculateTotalStudents() - formData.totalAbsent;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading observation...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/dashboard/observations')}
        >
          ← Back to Observations
        </button>
        <h1>Edit Classroom Observation</h1>
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`${styles.step} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
          >
            <div className={styles.stepNumber}>{index + 1}</div>
            <div className={styles.stepTitle}>{step}</div>
          </div>
        ))}
      </div>

      <div className={styles.formContainer}>
        {currentStep === 0 && (
          <div className={styles.section}>
            <h2>Basic Session Information</h2>
            
            <div className={styles.subsection}>
              <h3>Location Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>ខេត្ត/ក្រុង*</label>
                  <select
                    value={formData.provinceCode}
                    onChange={(e) => {
                      const selectedProvince = provinces.find(p => p.province_code.toString() === e.target.value);
                      updateFormData({ 
                        province: selectedProvince?.province_name_en || '',
                        provinceCode: e.target.value,
                        provinceNameKh: selectedProvince?.province_name_kh || '',
                        district: '',
                        districtCode: '',
                        districtNameKh: '',
                        commune: '',
                        communeCode: '',
                        communeNameKh: '',
                        village: '',
                        villageCode: '',
                        villageNameKh: ''
                      });
                      if (selectedProvince) {
                        fetchDistricts(selectedProvince.province_code.toString());
                        setSchools([]); // Reset schools when province changes
                      }
                    }}
                  >
                    <option value="">ជ្រើសរើសខេត្ត/ក្រុង</option>
                    {provinces.map(p => (
                      <option key={p.province_code} value={p.province_code.toString()}>
                        {p.province_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>ស្រុក/ខណ្ឌ*</label>
                  <select
                    value={formData.districtCode}
                    onChange={(e) => {
                      const selectedDistrict = districts.find(d => d.district_code.toString() === e.target.value);
                      updateFormData({ 
                        district: selectedDistrict?.district_name_en || '',
                        districtCode: e.target.value,
                        districtNameKh: selectedDistrict?.district_name_kh || '',
                        commune: '',
                        communeCode: '',
                        communeNameKh: '',
                        village: '',
                        villageCode: '',
                        villageNameKh: ''
                      });
                      if (selectedDistrict) {
                        fetchCommunes(selectedDistrict.district_code.toString());
                      }
                    }}
                    disabled={!formData.provinceCode}
                  >
                    <option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
                    {districts.map(d => (
                      <option key={d.district_code} value={d.district_code.toString()}>
                        {d.district_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>ឃុំ/សង្កាត់</label>
                  <select
                    value={formData.communeCode}
                    onChange={(e) => {
                      const selectedCommune = communes.find(c => c.commune_code.toString() === e.target.value);
                      updateFormData({ 
                        commune: selectedCommune?.commune_name_en || '',
                        communeCode: e.target.value,
                        communeNameKh: selectedCommune?.commune_name_kh || '',
                        village: '',
                        villageCode: '',
                        villageNameKh: ''
                      });
                      if (selectedCommune) {
                        fetchVillages(selectedCommune.commune_code.toString());
                      }
                    }}
                    disabled={!formData.districtCode}
                  >
                    <option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
                    {communes.map(c => (
                      <option key={c.commune_code} value={c.commune_code.toString()}>
                        {c.commune_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>ភូមិ</label>
                  <select
                    value={formData.villageCode}
                    onChange={(e) => {
                      const selectedVillage = villages.find(v => v.village_code === e.target.value);
                      updateFormData({ 
                        village: selectedVillage?.village_name_en || '',
                        villageCode: e.target.value,
                        villageNameKh: selectedVillage?.village_name_kh || ''
                      });
                    }}
                    disabled={!formData.communeCode}
                  >
                    <option value="">ជ្រើសរើសភូមិ</option>
                    {villages.map(v => (
                      <option key={v.village_code} value={v.village_code}>
                        {v.village_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Cluster</label>
                  <input
                    type="text"
                    value={formData.cluster}
                    onChange={(e) => updateFormData({ cluster: e.target.value })}
                    placeholder="Enter cluster"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>សាលារៀន*</label>
                  <select
                    value={formData.school}
                    onChange={(e) => {
                      const selectedSchool = schools.find(s => s.name === e.target.value);
                      updateFormData({ 
                        school: e.target.value,
                        schoolId: selectedSchool?.id || 0
                      });
                    }}
                    disabled={!formData.provinceCode}
                  >
                    <option value="">ជ្រើសរើសសាលារៀន</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Teacher Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Teacher Name*</label>
                  <input
                    type="text"
                    value={formData.nameOfTeacher}
                    onChange={(e) => updateFormData({ nameOfTeacher: e.target.value })}
                    placeholder="Enter teacher name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Gender*</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => updateFormData({ sex: e.target.value })}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Employment Type*</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => updateFormData({ employmentType: e.target.value })}
                  >
                    {employmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Session Details</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Subject*</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => updateFormData({ subject: e.target.value })}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Grade*</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.grade}
                    onChange={(e) => updateFormData({ grade: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Chapter</label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={(e) => updateFormData({ chapter: e.target.value })}
                    placeholder="Chapter number"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Lesson</label>
                  <input
                    type="text"
                    value={formData.lesson}
                    onChange={(e) => updateFormData({ lesson: e.target.value })}
                    placeholder="Lesson number"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Lesson Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Lesson title"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={formData.subTitle}
                    onChange={(e) => updateFormData({ subTitle: e.target.value })}
                    placeholder="Lesson subtitle"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Session Time*</label>
                  <select
                    value={formData.sessionTime}
                    onChange={(e) => updateFormData({ sessionTime: e.target.value })}
                  >
                    {sessionTimes.map(time => (
                      <option key={time.value} value={time.value}>{time.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Inspection Date*</label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => updateFormData({ inspectionDate: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData({ startTime: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateFormData({ endTime: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Academic Year</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => updateFormData({ academicYear: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => updateFormData({ semester: parseInt(e.target.value) })}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Lesson Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.lessonDurationMinutes}
                    onChange={(e) => updateFormData({ lessonDurationMinutes: parseInt(e.target.value) || 45 })}
                    min="15"
                    max="240"
                  />
                </div>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Student Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Total Male Students</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalMale}
                    onChange={(e) => updateFormData({ totalMale: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Total Female Students</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalFemale}
                    onChange={(e) => updateFormData({ totalFemale: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Total Students</label>
                  <input
                    type="number"
                    value={calculateTotalStudents()}
                    disabled
                    className={styles.readOnlyInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Total Absent</label>
                  <input
                    type="number"
                    min="0"
                    max={calculateTotalStudents()}
                    value={formData.totalAbsent}
                    onChange={(e) => updateFormData({ totalAbsent: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Absent Female</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalFemale}
                    value={formData.totalAbsentFemale}
                    onChange={(e) => updateFormData({ totalAbsentFemale: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Present Students</label>
                  <input
                    type="number"
                    value={calculatePresentStudents()}
                    disabled
                    className={styles.readOnlyInput}
                  />
                </div>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>Inspector Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Inspector Name</label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={(e) => updateFormData({ inspectorName: e.target.value })}
                    placeholder="Enter inspector name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <input
                    type="text"
                    value={formData.inspectorPosition}
                    onChange={(e) => updateFormData({ inspectorPosition: e.target.value })}
                    placeholder="Enter position"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Organization</label>
                  <input
                    type="text"
                    value={formData.inspectorOrganization}
                    onChange={(e) => updateFormData({ inspectorOrganization: e.target.value })}
                    placeholder="Enter organization"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.section}>
            <h2>Teaching Evaluation</h2>
            
            <div className={styles.levelSelection}>
              <p className={styles.sectionDescription}>
                Select evaluation level(s):
              </p>
              <div className={styles.levelOptions}>
                <label className={styles.levelCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(1)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLevels([...selectedLevels, 1]);
                      } else {
                        setSelectedLevels(selectedLevels.filter(l => l !== 1));
                      }
                    }}
                  />
                  <span className={styles.levelTag} style={{ backgroundColor: '#52c41a' }}>
                    Level 1 - Basic
                  </span>
                </label>
                <label className={styles.levelCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(2)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLevels([...selectedLevels, 2]);
                      } else {
                        setSelectedLevels(selectedLevels.filter(l => l !== 2));
                      }
                    }}
                  />
                  <span className={styles.levelTag} style={{ backgroundColor: '#1890ff' }}>
                    Level 2 - Intermediate
                  </span>
                </label>
                <label className={styles.levelCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(3)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLevels([...selectedLevels, 3]);
                      } else {
                        setSelectedLevels(selectedLevels.filter(l => l !== 3));
                      }
                    }}
                  />
                  <span className={styles.levelTag} style={{ backgroundColor: '#fa8c16' }}>
                    Level 3 - Advanced
                  </span>
                </label>
              </div>
            </div>
            
            <div className={styles.evaluationGrid}>
              {filteredIndicators.map((indicator) => (
                <div key={indicator.fieldId} className={styles.evaluationItem}>
                  <div className={styles.evaluationHeader}>
                    <span className={styles.levelBadge} style={{
                      backgroundColor: indicator.evaluationLevel === 1 ? '#52c41a' : 
                                     indicator.evaluationLevel === 2 ? '#1890ff' : '#fa8c16'
                    }}>
                      Level {indicator.evaluationLevel}
                    </span>
                    <h3>{indicator.indicatorMain || indicator.indicatorMainEn}</h3>
                    <p>{indicator.indicatorSub || indicator.indicatorSubEn}</p>
                  </div>
                  
                  <div className={styles.ratingOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`indicator_${indicator.fieldId}`}
                        value="yes"
                        checked={formData.evaluationData[`indicator_${indicator.fieldId}`] === 'yes'}
                        onChange={() => updateEvaluationScore(indicator.fieldId, 'yes')}
                      />
                      <span className={styles.radioLabel} style={{ color: '#52c41a' }}>
                        Yes / បាទ/ចាស
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`indicator_${indicator.fieldId}`}
                        value="some_practice"
                        checked={formData.evaluationData[`indicator_${indicator.fieldId}`] === 'some_practice'}
                        onChange={() => updateEvaluationScore(indicator.fieldId, 'some_practice')}
                      />
                      <span className={styles.radioLabel} style={{ color: '#faad14' }}>
                        Some Practice / អនុវត្តខ្លះ
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`indicator_${indicator.fieldId}`}
                        value="no"
                        checked={formData.evaluationData[`indicator_${indicator.fieldId}`] === 'no'}
                        onChange={() => updateEvaluationScore(indicator.fieldId, 'no')}
                      />
                      <span className={styles.radioLabel} style={{ color: '#ff4d4f' }}>
                        No / ទេ
                      </span>
                    </label>
                  </div>
                  
                  <div className={styles.commentSection}>
                    <label>AI Context & Comments</label>
                    <textarea
                      value={formData.evaluationComments[`indicator_${indicator.fieldId}_comment`] || ''}
                      onChange={(e) => updateEvaluationComment(indicator.fieldId, e.target.value)}
                      placeholder={indicator.aiContext || 'Add any specific observations or feedback...'}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {filteredIndicators.length === 0 && (
              <div className={styles.noIndicators}>
                <p>Please select at least one evaluation level to see indicators.</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.section}>
            <h2>Student Assessment</h2>
            <p className={styles.sectionDescription}>
              Evaluate a sample of students across different subjects (optional)
            </p>
            
            <div className={styles.assessmentTable}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    {formData.studentAssessment.subjects.map(subject => (
                      <th key={subject.order}>
                        {subject.name_en}
                        <br />
                        <small>(Max: {subject.max_score})</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.studentAssessment.students.map(student => (
                    <tr key={student.order}>
                      <td>
                        {student.identifier} - {student.name}
                        <small> ({student.gender})</small>
                      </td>
                      {formData.studentAssessment.subjects.map(subject => (
                        <td key={`${student.order}-${subject.order}`}>
                          <input
                            type="number"
                            min="0"
                            max={subject.max_score}
                            step="0.5"
                            value={formData.studentAssessment.scores[`subject_${subject.order}`]?.[`student_${student.order}`] || ''}
                            onChange={(e) => updateStudentScore(subject.order, student.order, parseFloat(e.target.value) || 0)}
                            className={styles.scoreInput}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.section}>
            <h2>Review & Submit</h2>
            
            <div className={styles.reviewSection}>
              <h3>Session Summary</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <label>School:</label>
                  <span>{formData.school}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Teacher:</label>
                  <span>{formData.nameOfTeacher}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Subject:</label>
                  <span>{formData.subject} - Grade {formData.grade}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Date:</label>
                  <span>{new Date(formData.inspectionDate).toLocaleDateString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Students:</label>
                  <span>{calculatePresentStudents()} present / {calculateTotalStudents()} total</span>
                </div>
              </div>
            </div>
            
            <div className={styles.reviewSection}>
              <h3>Evaluation Summary</h3>
              <div className={styles.evaluationSummary}>
                {Object.entries(formData.evaluationData).length > 0 ? (
                  <div className={styles.summaryList}>
                    {filteredIndicators.map(indicator => {
                      const score = formData.evaluationData[`indicator_${indicator.fieldId}`];
                      return score ? (
                        <div key={indicator.fieldId} className={styles.summaryEvalItem}>
                          <span>{indicator.indicatorMain || indicator.indicatorMainEn}:</span>
                          <strong style={{
                            color: score === 'yes' ? '#52c41a' : 
                                   score === 'some_practice' ? '#faad14' : '#ff4d4f'
                          }}>
                            {score === 'yes' ? 'Yes' : 
                             score === 'some_practice' ? 'Some Practice' : 'No'}
                          </strong>
                        </div>
                      ) : null;
                    })}
                    <div className={styles.summaryTotal}>
                      <span>Evaluation Levels:</span>
                      <strong>
                        {selectedLevels.map(level => `Level ${level}`).join(', ')}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p>No evaluation data entered</p>
                )}
              </div>
            </div>
            
            <div className={styles.reviewSection}>
              <h3>General Notes</h3>
              <textarea
                value={formData.generalNotes}
                onChange={(e) => updateFormData({ generalNotes: e.target.value })}
                placeholder="Add any additional observations or recommendations..."
                rows={4}
                className={styles.fullWidthTextarea}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.navigation}>
        {currentStep > 0 && (
          <button 
            className={styles.prevButton}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            ← Previous
          </button>
        )}
        {currentStep < steps.length - 1 ? (
          <button 
            className={styles.nextButton}
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!isStepValid()}
          >
            Next →
          </button>
        ) : (
          <button 
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!isStepValid() || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}