'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import styles from './edit-observation.module.css';
import { useToast, ToastContainer } from '@/components/Toast';

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
// These will be defined inside the component to use translations

// Helper function to extract time from datetime
const extractTimeFromDateTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    // If the year is 1970, it means we stored just time, extract HH:MM
    if (date.getFullYear() === 1970) {
      return date.toTimeString().substring(0, 5); // HH:MM format
    }
    // Otherwise extract time from full datetime
    return date.toTimeString().substring(0, 5);
  } catch (error) {
    console.error('Error extracting time:', error);
    return '';
  }
};

export default function EditObservationPage() {
  const router = useRouter();
  const params = useParams();
  const { t, language } = useTranslation();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Define options arrays using translations
  const subjects = [
    t('observations.mathematics'),
    t('observations.khmerLanguage'),
    t('observations.science'),
    t('observations.socialStudies'),
    t('observations.english'),
    t('observations.physicalEducation')
  ];
  
  const employmentTypes = [
    { value: 'official', label: t('teachers.official') },
    { value: 'contract', label: t('teachers.contract') },
    { value: 'volunteer', label: t('teachers.volunteer') }
  ];
  
  const sessionTimes = [
    { value: 'morning', label: t('observations.morning') },
    { value: 'afternoon', label: t('observations.afternoon') },
    { value: 'full_day', label: t('observations.fullDay') }
  ];
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Function to populate geographic codes
  const populateGeographicCodes = async (provinceName: string, districtName: string, communeName: string, villageName: string) => {
    try {
      // Find province
      const provincesResponse = await fetch('/api/geographic/provinces');
      if (provincesResponse.ok) {
        const data = await provincesResponse.json();
        const provinces = data.provinces || [];
        console.log('Looking for province:', provinceName, 'in', provinces.length, 'provinces');
        const province = provinces.find((p: any) => 
          p.province_name_en === provinceName || p.province_name_kh === provinceName
        );
        console.log('Found province:', province);
        if (province) {
          const provinceCode = String(province.province_code);
          updateFormData({ 
            provinceCode: provinceCode,
            provinceNameKh: province.province_name_kh 
          });
          
          // Find district
          const districtsResponse = await fetch(`/api/geographic/districts?provinceCode=${provinceCode}`);
          if (districtsResponse.ok) {
            const districtData = await districtsResponse.json();
            const districts = districtData.districts || [];
            const district = districts.find((d: any) => 
              d.district_name_en === districtName || d.district_name_kh === districtName
            );
            if (district) {
              const districtCode = String(district.district_code);
              updateFormData({ 
                districtCode: districtCode,
                districtNameKh: district.district_name_kh 
              });
              
              // Find commune
              const communesResponse = await fetch(`/api/geographic/communes?districtCode=${districtCode}`);
              if (communesResponse.ok) {
                const communeData = await communesResponse.json();
                const communes = communeData.communes || [];
                const commune = communes.find((c: any) => 
                  c.commune_name_en === communeName || c.commune_name_kh === communeName
                );
                if (commune) {
                  const communeCode = String(commune.commune_code);
                  updateFormData({ 
                    communeCode: communeCode,
                    communeNameKh: commune.commune_name_kh 
                  });
                  
                  // Find village
                  const villagesResponse = await fetch(`/api/geographic/villages?communeCode=${communeCode}`);
                  if (villagesResponse.ok) {
                    const villageData = await villagesResponse.json();
                    const villages = villageData.villages || [];
                    const village = villages.find((v: any) => 
                      v.village_name_en === villageName || v.village_name_kh === villageName
                    );
                    if (village) {
                      updateFormData({ 
                        villageCode: String(village.village_code),
                        villageNameKh: village.village_name_kh 
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error populating geographic codes:', error);
    }
  };

  // Monitor formData changes for debugging
  useEffect(() => {
    console.log('FormData changed - critical fields:', {
      cluster: formData.cluster,
      inspectorName: formData.inspectorName,
      inspectorPosition: formData.inspectorPosition,
      inspectorOrganization: formData.inspectorOrganization
    });
  }, [formData.cluster, formData.inspectorName, formData.inspectorPosition, formData.inspectorOrganization]);

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
        console.log('Loaded observation data:', data);
        console.log('Critical fields from API:', {
          cluster: data.cluster,
          inspectorName: data.inspectorName,
          inspectorPosition: data.inspectorPosition,
          inspectorOrganization: data.inspectorOrganization
        });
        
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
          startTime: data.startTime ? extractTimeFromDateTime(data.startTime) : '',
          endTime: data.endTime ? extractTimeFromDateTime(data.endTime) : '',
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
        console.log('Evaluation records:', data.evaluationRecords);
        if (data.evaluationRecords && Array.isArray(data.evaluationRecords)) {
          data.evaluationRecords.forEach((record: any) => {
            // Use the field's indicatorSequence if available, otherwise use fieldId
            const indicatorKey = record.field?.indicatorSequence || record.fieldId;
            mappedData.evaluationData[`indicator_${indicatorKey}`] = record.scoreValue;
            if (record.notes) {
              mappedData.evaluationComments[`indicator_${indicatorKey}_comment`] = record.notes;
            }
          });
        }

        // Extract student assessment data
        console.log('Student assessment sessions:', data.studentAssessmentSessions);
        if (data.studentAssessmentSessions && data.studentAssessmentSessions.length > 0) {
          const session = data.studentAssessmentSessions[0];
          
          // Map subjects
          if (session.subjects && Array.isArray(session.subjects)) {
            mappedData.studentAssessment.subjects = session.subjects.map((subject: any) => ({
              id: subject.subjectId,
              name_km: subject.subjectNameKm,
              name_en: subject.subjectNameEn,
              order: subject.subjectOrder,
              max_score: subject.maxScore
            }));
          }
          
          // Map students
          if (session.students && Array.isArray(session.students)) {
            mappedData.studentAssessment.students = session.students.map((student: any) => ({
              id: student.studentId,
              identifier: student.studentIdentifier,
              order: student.studentOrder,
              name: student.studentName || '',
              gender: student.studentGender
            }));
          }
          
          // Map scores
          if (session.scores && Array.isArray(session.scores)) {
            session.scores.forEach((score: any) => {
              // Find the subject and student orders
              const subject = session.subjects?.find((s: any) => s.subjectId === score.subjectId);
              const student = session.students?.find((s: any) => s.studentId === score.studentId);
              
              if (subject && student) {
                const subjectKey = `subject_${subject.subjectOrder}`;
                const studentKey = `student_${student.studentOrder}`;
                
                if (!mappedData.studentAssessment.scores[subjectKey]) {
                  mappedData.studentAssessment.scores[subjectKey] = {};
                }
                mappedData.studentAssessment.scores[subjectKey][studentKey] = score.score;
              }
            });
          }
        }

        console.log('Mapped form data:', mappedData);
        console.log('Critical fields in mappedData:', {
          cluster: mappedData.cluster,
          inspectorName: mappedData.inspectorName,
          inspectorPosition: mappedData.inspectorPosition,
          inspectorOrganization: mappedData.inspectorOrganization
        });
        setFormData(mappedData);
        
        // Log after state update
        setTimeout(() => {
          console.log('FormData after setState (delayed check):', {
            cluster: formData.cluster,
            inspectorName: formData.inspectorName,
            inspectorPosition: formData.inspectorPosition,
            inspectorOrganization: formData.inspectorOrganization
          });
        }, 1000);
        
        // Populate geographic codes by looking them up
        if (data.province && data.district && data.commune && data.village) {
          populateGeographicCodes(data.province, data.district, data.commune, data.village);
        }

        // Set selected levels - prioritize evaluationLevels array over single level
        console.log('Loading evaluation levels:', { 
          evaluationLevels: data.evaluationLevels, 
          level: data.level 
        });
        
        if (data.evaluationLevels && Array.isArray(data.evaluationLevels) && data.evaluationLevels.length > 0) {
          console.log('Setting selectedLevels from evaluationLevels:', data.evaluationLevels);
          setSelectedLevels(data.evaluationLevels);
        } else if (data.level) {
          console.log('Setting selectedLevels from single level:', [data.level]);
          setSelectedLevels([data.level]);
        } else {
          console.log('No evaluation levels found, using default [1]');
          setSelectedLevels([1]);
        }

        // Load location cascading data
        if (mappedData.provinceCode) {
          await fetchDistricts(mappedData.provinceCode);
          // Load schools based on province
          const params = new URLSearchParams();
          params.append('provinceCode', mappedData.provinceCode);
          
          try {
            const response = await fetch(`/api/schools/search?${params.toString()}`);
            if (response.ok) {
              const data = await response.json();
              setSchools(data.schools || []);
              
              // Ensure the current school is in the list or add it
              if (mappedData.school && mappedData.schoolId) {
                const schoolExists = (data.schools || []).some((s: any) => s.id === mappedData.schoolId);
                if (!schoolExists) {
                  // Add the current school to the list if it's not there
                  setSchools([...data.schools || [], { 
                    id: mappedData.schoolId, 
                    name: mappedData.school,
                    code: '' 
                  }]);
                }
              }
            }
          } catch (error) {
            console.error('Failed to load schools:', error);
          }
        }
        if (mappedData.districtCode) {
          await fetchCommunes(mappedData.districtCode);
        }
        if (mappedData.communeCode) {
          await fetchVillages(mappedData.communeCode);
        }
        // Mark initial load as complete after all data is loaded
        setIsInitialLoad(false);
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
  
  console.log('Current selectedLevels:', selectedLevels);
  console.log('Total evaluationIndicators:', evaluationIndicators.length);
  console.log('Filtered indicators count:', filteredIndicators.length);
  console.log('Evaluation levels in indicators:', [...new Set(evaluationIndicators.map(i => i.evaluationLevel))]);
  
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
    console.log('Updating form data:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateEvaluationScore = (indicatorSequence: number, score: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationData: {
        ...prev.evaluationData,
        [`indicator_${indicatorSequence}`]: score
      }
    }));
  };

  const updateEvaluationComment = (indicatorSequence: number, comment: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationComments: {
        ...prev.evaluationComments,
        [`indicator_${indicatorSequence}_comment`]: comment
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

  const updateStudentInfo = (studentOrder: number, field: 'name' | 'gender', value: string) => {
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        students: prev.studentAssessment.students.map(student => 
          student.order === studentOrder 
            ? { ...student, [field]: value }
            : student
        )
      }
    }));
  };

  const addMoreStudents = (count: number = 5) => {
    setFormData(prev => {
      const currentStudents = prev.studentAssessment.students;
      const lastOrder = currentStudents.length > 0 
        ? Math.max(...currentStudents.map(s => s.order)) 
        : 0;
      
      const newStudents = Array.from({ length: count }, (_, i) => ({
        id: `new_${Date.now()}_${i}`,
        identifier: `សិស្សទី${lastOrder + i + 1}`,
        order: lastOrder + i + 1,
        name: '',
        gender: ''
      }));

      return {
        ...prev,
        studentAssessment: {
          ...prev.studentAssessment,
          students: [...currentStudents, ...newStudents]
        }
      };
    });
  };

  const removeStudent = (studentOrder: number) => {
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        students: prev.studentAssessment.students.filter(s => s.order !== studentOrder),
        scores: Object.keys(prev.studentAssessment.scores).reduce((acc, subjectKey) => {
          const subjectScores = { ...prev.studentAssessment.scores[subjectKey] };
          delete subjectScores[`student_${studentOrder}`];
          return { ...acc, [subjectKey]: subjectScores };
        }, {})
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
          cluster: formData.cluster,
          inspectorName: formData.inspectorName,
          inspectorPosition: formData.inspectorPosition,
          inspectorOrganization: formData.inspectorOrganization,
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

      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`/api/observations/${observationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('Update response status:', response.status);
      const responseData = await response.json();
      console.log('Update response data:', responseData);
      
      if (response.ok) {
        toast.success(
          language === 'km' ? 'ជោគជ័យ!' : 'Success!',
          language === 'km' ? 'ការអង្កេតត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!' : 'Observation updated successfully!',
          3000
        );
        setTimeout(() => {
          router.push(`/dashboard/observations/${observationId}`);
        }, 1500);
      } else {
        console.error('Update failed:', responseData);
        toast.error(
          language === 'km' ? 'បរាជ័យ!' : 'Failed!',
          responseData.details || responseData.error || (language === 'km' ? 'មិនអាចធ្វើបច្ចុប្បន្នភាពការអង្កេតបានទេ' : 'Failed to update observation'),
          5000
        );
      }
    } catch (error) {
      console.error('Error updating observation:', error);
      toast.error(
        language === 'km' ? 'កំហុស!' : 'Error!',
        language === 'km' ? 'មានកំហុសក្នុងការធ្វើបច្ចុប្បន្នភាពការអង្កេត' : 'An error occurred while updating the observation',
        5000
      );
    } finally {
      setSaving(false);
    }
  };

  const steps = [t('forms.basicInfo'), t('forms.teachingEvaluation'), t('forms.studentAssessment'), t('forms.reviewSubmit')];

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
    <ToastContainer>
      <div className={styles.container}>
        <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>{t('forms.editClassroomObservation')}</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => router.push(`/dashboard/observations/${params.id}`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#138496';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#17a2b8';
              }}
            >
              👁️ {language === 'km' ? 'មើលអង្កេត' : 'View Observation'}
            </button>
            <button 
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
                gap: '5px'
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
          </div>
        </div>
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
            <h2>{t('forms.basicInfo')}</h2>
            
            <div className={styles.subsection}>
              <h3>{t('forms.locationInfo')}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('forms.province')}*</label>
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
                        // Only reset schools if this is a user-initiated change, not during initial load
                        if (!isInitialLoad) {
                          setSchools([]); // Reset schools when province changes
                        }
                      }
                    }}
                  >
                    <option value="">{t('forms.selectOne')}</option>
                    {provinces.map(p => (
                      <option key={p.province_code} value={p.province_code.toString()}>
                        {language === 'km' ? p.province_name_kh : p.province_name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.district')}*</label>
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
                    <option value="">{t('forms.selectOne')}</option>
                    {districts.map(d => (
                      <option key={d.district_code} value={d.district_code.toString()}>
                        {language === 'km' ? d.district_name_kh : d.district_name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.commune')}</label>
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
                    <option value="">{t('forms.selectOne')}</option>
                    {communes.map(c => (
                      <option key={c.commune_code} value={c.commune_code.toString()}>
                        {language === 'km' ? c.commune_name_kh : c.commune_name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.village')}</label>
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
                    <option value="">{t('forms.selectOne')}</option>
                    {villages.map(v => (
                      <option key={v.village_code} value={v.village_code}>
                        {language === 'km' ? v.village_name_kh : v.village_name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.cluster')}</label>
                  <input
                    type="text"
                    value={formData.cluster}
                    onChange={(e) => updateFormData({ cluster: e.target.value })}
                    placeholder={t('forms.cluster')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.school')}*</label>
                  <select
                    value={formData.schoolId || ''}
                    onChange={(e) => {
                      const selectedSchool = schools.find(s => s.id === parseInt(e.target.value));
                      updateFormData({ 
                        school: selectedSchool?.name || '',
                        schoolId: selectedSchool?.id || 0
                      });
                    }}
                    disabled={!formData.provinceCode}
                  >
                    <option value="">{t('forms.selectOne')}</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {!formData.provinceCode && (
                    <small className={styles.helpText}>
                      Please select a province first to load schools
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.subsection}>
              <h3>{t('forms.teacherInfo')}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('forms.teacherName')}*</label>
                  <input
                    type="text"
                    value={formData.nameOfTeacher}
                    onChange={(e) => updateFormData({ nameOfTeacher: e.target.value })}
                    placeholder={t('forms.teacherName')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.teacherGender')}*</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => updateFormData({ sex: e.target.value })}
                  >
                    <option value="M">{t('observations.male')}</option>
                    <option value="F">{t('observations.female')}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.employmentType')}*</label>
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
              <h3>{t('forms.sessionDetails')}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('observations.subject')}*</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => updateFormData({ subject: e.target.value })}
                  >
                    <option value="">{t('forms.selectOne')}</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.grade')}*</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.grade}
                    onChange={(e) => updateFormData({ grade: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.chapter')}</label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={(e) => updateFormData({ chapter: e.target.value })}
                    placeholder={t('observations.chapter')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.lesson')}</label>
                  <input
                    type="text"
                    value={formData.lesson}
                    onChange={(e) => updateFormData({ lesson: e.target.value })}
                    placeholder={t('observations.lesson')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.lessonTitle')}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder={t('forms.lessonTitle')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.lessonSubtitle')}</label>
                  <input
                    type="text"
                    value={formData.subTitle}
                    onChange={(e) => updateFormData({ subTitle: e.target.value })}
                    placeholder={t('forms.lessonSubtitle')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.sessionTime')}*</label>
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
                  <label>{t('forms.inspectionDate')}*</label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => updateFormData({ inspectionDate: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.startTime')}</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData({ startTime: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.endTime')}</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateFormData({ endTime: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.academicYear')}</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => updateFormData({ academicYear: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.semester')}</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => updateFormData({ semester: parseInt(e.target.value) })}
                  >
                    <option value={1}>{language === 'km' ? `${t('forms.semester')} ១` : `${t('forms.semester')} 1`}</option>
                    <option value={2}>{language === 'km' ? `${t('forms.semester')} ២` : `${t('forms.semester')} 2`}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.lessonDuration')}</label>
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
              <h3>{t('forms.studentAttendance')}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('observations.totalMaleStudents')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalMale}
                    onChange={(e) => updateFormData({ totalMale: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.totalFemaleStudents')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalFemale}
                    onChange={(e) => updateFormData({ totalFemale: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.totalStudents')}</label>
                  <input
                    type="number"
                    value={calculateTotalStudents()}
                    disabled
                    className={styles.readOnlyInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.totalAbsent')}</label>
                  <input
                    type="number"
                    min="0"
                    max={calculateTotalStudents()}
                    value={formData.totalAbsent}
                    onChange={(e) => updateFormData({ totalAbsent: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.absentFemale')}</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalFemale}
                    value={formData.totalAbsentFemale}
                    onChange={(e) => updateFormData({ totalAbsentFemale: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('observations.presentStudents')}</label>
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
              <h3>{t('forms.inspectorInfo')}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t('forms.inspectorName')}</label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={(e) => updateFormData({ inspectorName: e.target.value })}
                    placeholder={t('forms.inspectorName')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.position')}</label>
                  <input
                    type="text"
                    value={formData.inspectorPosition}
                    onChange={(e) => updateFormData({ inspectorPosition: e.target.value })}
                    placeholder={t('forms.position')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('forms.organization')}</label>
                  <input
                    type="text"
                    value={formData.inspectorOrganization}
                    onChange={(e) => updateFormData({ inspectorOrganization: e.target.value })}
                    placeholder={t('forms.organization')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.section}>
            <h2>{t('forms.teachingEvaluation')}</h2>
            
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
                        const newLevels = [...selectedLevels, 1];
                        console.log('Adding Level 1, new levels:', newLevels);
                        setSelectedLevels(newLevels);
                      } else {
                        const newLevels = selectedLevels.filter(l => l !== 1);
                        console.log('Removing Level 1, new levels:', newLevels);
                        setSelectedLevels(newLevels);
                      }
                    }}
                  />
                  <span className={styles.levelTag} style={{ backgroundColor: '#52c41a' }}>
                    {t('evaluationLevels.level1')}
                  </span>
                </label>
                <label className={styles.levelCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(2)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newLevels = [...selectedLevels, 2];
                        console.log('Adding Level 2, new levels:', newLevels);
                        setSelectedLevels(newLevels);
                      } else {
                        const newLevels = selectedLevels.filter(l => l !== 2);
                        console.log('Removing Level 2, new levels:', newLevels);
                        setSelectedLevels(newLevels);
                      }
                    }}
                  />
                  <span className={styles.levelTag} style={{ backgroundColor: '#1890ff' }}>
                    {t('evaluationLevels.level2')}
                  </span>
                </label>
                <label className={styles.levelCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(3)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newLevels = [...selectedLevels, 3];
                        console.log('Adding Level 3, new levels:', newLevels);
                        setSelectedLevels(newLevels);
                      } else {
                        const newLevels = selectedLevels.filter(l => l !== 3);
                        console.log('Removing Level 3, new levels:', newLevels);
                        setSelectedLevels(newLevels);
                      }
                    }}
                  />
                  <span className={styles.levelTag} style={{ backgroundColor: '#fa8c16' }}>
                    {t('evaluationLevels.level3')}
                  </span>
                </label>
              </div>
            </div>
            
            <div className={styles.evaluationGrid}>
              {filteredIndicators.map((indicator) => (
                <div key={indicator.indicatorSequence} className={styles.evaluationItem}>
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
                        name={`indicator_${indicator.indicatorSequence}`}
                        value="yes"
                        checked={formData.evaluationData[`indicator_${indicator.indicatorSequence}`] === 'yes'}
                        onChange={() => updateEvaluationScore(indicator.indicatorSequence, 'yes')}
                      />
                      <span className={styles.radioLabel} style={{ color: '#52c41a' }}>
                        {t('forms.evaluationYes')}
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`indicator_${indicator.indicatorSequence}`}
                        value="some_practice"
                        checked={formData.evaluationData[`indicator_${indicator.indicatorSequence}`] === 'some_practice'}
                        onChange={() => updateEvaluationScore(indicator.indicatorSequence, 'some_practice')}
                      />
                      <span className={styles.radioLabel} style={{ color: '#faad14' }}>
                        {t('forms.evaluationSomePractice')}
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`indicator_${indicator.indicatorSequence}`}
                        value="no"
                        checked={formData.evaluationData[`indicator_${indicator.indicatorSequence}`] === 'no'}
                        onChange={() => updateEvaluationScore(indicator.indicatorSequence, 'no')}
                      />
                      <span className={styles.radioLabel} style={{ color: '#ff4d4f' }}>
                        {t('forms.evaluationNo')}
                      </span>
                    </label>
                  </div>
                  
                  <div className={styles.commentSection}>
                    <label>{t('forms.aiContextComments')}</label>
                    <textarea
                      value={formData.evaluationComments[`indicator_${indicator.indicatorSequence}_comment`] || ''}
                      onChange={(e) => updateEvaluationComment(indicator.indicatorSequence, e.target.value)}
                      placeholder={indicator.aiContext || t('forms.additionalObservations')}
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
            <h2>{t('forms.studentAssessment')}</h2>
            <p className={styles.sectionDescription}>
              Evaluate a sample of students across different subjects (optional)
            </p>
            
            <div className={styles.assessmentContainer}>
              <div className={styles.assessmentTableWrapper}>
                <table className={styles.assessmentTable}>
                  <thead>
                    <tr>
                      <th className={styles.studentColumn}>{t('observations.student')}</th>
                      {formData.studentAssessment.subjects.map(subject => (
                        <th key={subject.order} className={styles.scoreColumn}>
                          <div className={styles.subjectHeader}>
                            <span className={styles.subjectName}>{language === 'km' ? subject.name_km : subject.name_en}</span>
                            <span className={styles.maxScore}>({t('forms.max')}: {subject.max_score})</span>
                          </div>
                        </th>
                      ))}
                      <th className={styles.actionColumn}>{t('forms.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.studentAssessment.students.map((student, index) => (
                      <tr key={student.order} className={styles.studentRow}>
                        <td className={styles.studentCell}>
                          <div className={styles.studentDataRow}>
                            <input
                              type="text"
                              value={student.name || ''}
                              onChange={(e) => updateStudentInfo(student.order, 'name', e.target.value)}
                              placeholder={`${student.identifier} - ${t('forms.enterName')}`}
                              className={styles.nameInputAligned}
                            />
                            <select
                              value={student.gender || ''}
                              onChange={(e) => updateStudentInfo(student.order, 'gender', e.target.value)}
                              className={styles.genderSelectAligned}
                            >
                              <option value="">{t('observations.gender')}</option>
                              <option value="M">{t('observations.male')}</option>
                              <option value="F">{t('observations.female')}</option>
                            </select>
                          </div>
                        </td>
                        {formData.studentAssessment.subjects.map(subject => (
                          <td key={`${student.order}-${subject.order}`} className={styles.scoreCell}>
                            <input
                              type="number"
                              min="0"
                              max={subject.max_score}
                              step="0.5"
                              value={formData.studentAssessment.scores[`subject_${subject.order}`]?.[`student_${student.order}`] || ''}
                              onChange={(e) => updateStudentScore(subject.order, student.order, parseFloat(e.target.value) || 0)}
                              className={styles.scoreInputField}
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className={styles.actionCell}>
                          {formData.studentAssessment.students.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeStudent(student.order)}
                              className={styles.removeButton}
                              title={t('forms.removeStudent')}
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className={styles.addStudentSection}>
                <button
                  type="button"
                  onClick={() => addMoreStudents(5)}
                  className={styles.addStudentButton}
                >
                  + {t('forms.addStudents').replace('{{count}}', '5')}
                </button>
                <button
                  type="button"
                  onClick={() => addMoreStudents(1)}
                  className={styles.addSingleStudentButton}
                >
                  + {t('forms.addStudent')}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.section}>
            <h2>{t('forms.reviewSubmit')}</h2>
            
            <div className={styles.reviewSection}>
              <h3>{t('observations.sessionSummary')}</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <label>{t('observations.school')}:</label>
                  <span>{formData.school}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{t('observations.teacher')}:</label>
                  <span>{formData.nameOfTeacher}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{t('observations.subject')}:</label>
                  <span>{formData.subject} - Grade {formData.grade}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{t('common.date')}:</label>
                  <span>{new Date(formData.inspectionDate).toLocaleDateString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{t('observations.totalStudents')}:</label>
                  <span>{calculatePresentStudents()} {t('observations.present')} / {calculateTotalStudents()} {t('common.total')}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.reviewSection}>
              <h3>{t('observations.evaluationSummary')}</h3>
              <div className={styles.evaluationSummary}>
                {Object.entries(formData.evaluationData).length > 0 ? (
                  <div className={styles.summaryList}>
                    {filteredIndicators.map(indicator => {
                      const score = formData.evaluationData[`indicator_${indicator.indicatorSequence}`];
                      return score ? (
                        <div key={indicator.indicatorSequence} className={styles.summaryEvalItem}>
                          <div className={styles.indicatorInfo}>
                            <span className={styles.indicatorMainText}>
                              {indicator.indicatorMain || indicator.indicatorMainEn}
                            </span>
                            {(indicator.indicatorSub || indicator.indicatorSubEn) && (
                              <span className={styles.indicatorSubText}>
                                {indicator.indicatorSub || indicator.indicatorSubEn}
                              </span>
                            )}
                          </div>
                          <strong style={{
                            color: score === 'yes' ? '#52c41a' : 
                                   score === 'some_practice' ? '#faad14' : '#ff4d4f'
                          }}>
                            {score === 'yes' ? t('forms.evaluationYes') : 
                             score === 'some_practice' ? t('forms.evaluationSomePractice') : t('forms.evaluationNo')}
                          </strong>
                        </div>
                      ) : null;
                    })}
                    <div className={styles.summaryTotal}>
                      <span>{t('evaluationLevels.title')}:</span>
                      <strong>
                        {selectedLevels.map(level => `${t('evaluationLevels.level')} ${level}`).join(', ')}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p>{t('messages.noData')}</p>
                )}
              </div>
            </div>
            
            <div className={styles.reviewSection}>
              <h3>{t('forms.generalNotes')}</h3>
              <textarea
                value={formData.generalNotes}
                onChange={(e) => updateFormData({ generalNotes: e.target.value })}
                placeholder={t('forms.additionalObservations')}
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
            ← {t('common.previous')}
          </button>
        )}
        {currentStep < steps.length - 1 ? (
          <button 
            className={styles.nextButton}
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!isStepValid()}
          >
            {t('common.next')} →
          </button>
        ) : (
          <button 
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!isStepValid() || saving}
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        )}
        </div>
      </div>
    </ToastContainer>
  );
}