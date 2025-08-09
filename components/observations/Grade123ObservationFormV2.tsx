"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";
import AIAnalysis from "@/components/ai/AIAnalysis";
import ProgressSteps from "@/components/ui/progress-steps";
import FormSection from "@/components/ui/form-section";
import AnimatedButton from "@/components/ui/animated-button";
import FadeIn from "@/components/ui/fade-in";
import { showToast } from "@/lib/toast";

// Performance constants
const DEBOUNCE_DELAY = 300;
const MAX_RETRIES = 3;
import styles from "@/app/dashboard/observations/new/new-observation.module.css";
import assessmentStyles from "@/app/dashboard/observations/student-assessment.module.css";

interface ObservationFormProps {
  subject: "KH" | "MATH";
  grade: "1" | "2" | "3";
  observationId?: string; // Optional: for edit mode
  mode?: "create" | "edit"; // Optional: defaults to "create"
}

interface MasterField {
  id: number;
  order: number;
  subject: string;
  grade: string;
  level: string;
  indicator: string;
  activity?: string;
  note?: string;
}

interface FormData {
  // Basic Session Info (Step 1)
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

  // Level-based Evaluation (Step 2)
  selectedLevels: string[];
  evaluationData: { [key: string]: string };
  evaluationComments: { [key: string]: string };

  // Student Assessment (Step 3)
  studentAssessment: {
    subjects: Array<{
      id?: string;
      name_km: string;
      name_en: string;
      order: number;
      max_score: number;
    }>;
    students: Array<{
      id?: string;
      identifier: string;
      order: number;
      name?: string;
      gender?: string;
    }>;
    scores: { [key: string]: { [key: string]: number } };
  };
}

export default function Grade123ObservationFormV2({ 
  subject, 
  grade, 
  observationId, 
  mode = "create" 
}: ObservationFormProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<MasterField[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs to prevent memory leaks and track component state
  const isUnmountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<FormData>({
    // Basic info
    province: "",
    provinceCode: "",
    provinceNameKh: "",
    district: "",
    districtCode: "",
    districtNameKh: "",
    commune: "",
    communeCode: "",
    communeNameKh: "",
    village: "",
    villageCode: "",
    villageNameKh: "",
    cluster: "",
    school: "",
    schoolId: 0,
    nameOfTeacher: "",
    sex: "M",
    employmentType: "official",
    sessionTime: "morning",
    subject: subject,
    chapter: "",
    lesson: "",
    title: "",
    subTitle: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    grade: parseInt(grade),
    totalMale: 0,
    totalFemale: 0,
    totalAbsent: 0,
    totalAbsentFemale: 0,
    inspectorName: "",
    inspectorPosition: "",
    inspectorOrganization: "",
    academicYear: "2025",
    semester: 1,
    lessonDurationMinutes: 45,
    generalNotes: "",

    // Level evaluation
    selectedLevels: [],
    evaluationData: {},
    evaluationComments: {},

    // Student assessment
    studentAssessment: {
      subjects: [
        {
          id: "1",
          name_km: subject === "KH" ? "អំណាន" : "គណនា",
          name_en: subject === "KH" ? "Reading" : "Calculation",
          order: 1,
          max_score: 100,
        },
        {
          id: "2",
          name_km: subject === "KH" ? "សរសេរ" : "គណិតផ្លូវចិត្ត",
          name_en: subject === "KH" ? "Writing" : "Mental Math",
          order: 2,
          max_score: 100,
        },
        {
          id: "3",
          name_km: subject === "KH" ? "វេយ្យាករណ៍" : "ដោះស្រាយបញ្ហា",
          name_en: subject === "KH" ? "Grammar" : "Problem Solving",
          order: 3,
          max_score: 100,
        },
      ],
      students: Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        identifier: `សិស្សទី${i + 1}`,
        order: i + 1,
        name: "",
        gender: i % 2 === 0 ? "M" : "F",
      })),
      scores: {},
    },
  });

  // Location data states
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [levelSelectionConfirmed, setLevelSelectionConfirmed] = useState(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);


  const steps = [
    { title: language === 'km' ? 'ព័ត៌មានមូលដ្ឋាន' : 'Basic Information' },
    { title: language === 'km' ? 'ការវាយតម្លៃការបង្រៀន' : 'Teaching Evaluation' },
    { title: language === 'km' ? 'ការវាយតម្លៃសិស្ស' : 'Student Assessment' },
    { title: language === 'km' ? 'ពិនិត្យ និងដាក់ស្នើ' : 'Review & Submit' }
  ];

  // Helper functions
  const getEmploymentTypeLabel = (value: string) => {
    return language === "km"
      ? {
          official: "មន្ត្រី",
          contract: "កិច្ចសន្យា",
          volunteer: "ស្ម័គ្រចិត្ត",
        }[value] || value
      : { official: "Official", contract: "Contract", volunteer: "Volunteer" }[
          value
        ] || value;
  };

  const getSessionTimeLabel = (value: string) => {
    return language === "km"
      ? { morning: "ព្រឹក", afternoon: "រសៀល", full_day: "ពេញមួយថ្ងៃ" }[
          value
        ] || value
      : { morning: "Morning", afternoon: "Afternoon", full_day: "Full Day" }[
          value
        ] || value;
  };

  // Memoized subject and grade names to prevent re-renders
  const subjectNames = useMemo(() => ({
    KH: { en: "Khmer Language", km: "ភាសាខ្មែរ" },
    MATH: { en: "Mathematics", km: "គណិតវិទ្យា" }
  }), []);

  const gradeNames = useMemo(() => ({
    "1": { en: "Grade 1", km: "ថ្នាក់ទី១" },
    "2": { en: "Grade 2", km: "ថ្នាក់ទី២" },
    "3": { en: "Grade 3", km: "ថ្នាក់ទី៣" }
  }), []);

  // Fetch location data on mount
  useEffect(() => {
    let isCancelled = false;
    
    const initializeData = async () => {
      try {
        await fetchProvinces();
        
        // Load observation data if in edit mode
        if (mode === "edit" && observationId && !dataLoaded && !isCancelled) {
          await loadObservationData();
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error initializing data:', error);
          showToast(language === 'km' ? 'មានបញ្ហាក្នុងការផ្ទុកទិន្នន័យ' : 'Error loading data', 'error');
        }
      }
    };
    
    initializeData();
    
    return () => {
      isCancelled = true;
    };
  }, [mode, observationId, dataLoaded, language]);

  // Debounced fetch fields when levels are selected
  useEffect(() => {
    if (!levelSelectionConfirmed || formData.selectedLevels.length === 0) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        fetchFields();
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [levelSelectionConfirmed, formData.selectedLevels]);

  // Debounced search schools when province changes
  useEffect(() => {
    if (!formData.provinceCode) {
      setSchools([]);
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        searchSchools(formData.provinceCode);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData.provinceCode]);

  const loadObservationData = useCallback(async () => {
    if (!observationId || isUnmountedRef.current) return;
    
    setLoading(true);
    
    try {
      // Create abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`/api/observations/${observationId}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Map the observation data to formData structure
        setFormData(prev => ({
          ...prev,
          // Basic info
          province: data.province || "",
          provinceCode: data.provinceCode || "",
          provinceNameKh: data.provinceNameKh || "",
          district: data.district || "",
          districtCode: data.districtCode || "",
          districtNameKh: data.districtNameKh || "",
          commune: data.commune || "",
          communeCode: data.communeCode || "",
          communeNameKh: data.communeNameKh || "",
          village: data.village || "",
          villageCode: data.villageCode || "",
          villageNameKh: data.villageNameKh || "",
          cluster: data.cluster || "",
          school: data.school || "",
          schoolId: data.schoolId || 0,
          nameOfTeacher: data.nameOfTeacher || "",
          sex: data.sex || "M",
          employmentType: data.employmentType || "official",
          sessionTime: data.sessionTime || "morning",
          subject: data.subject || subject,
          chapter: data.chapter || "",
          lesson: data.lesson || "",
          title: data.title || "",
          subTitle: data.subTitle || "",
          inspectionDate: data.inspectionDate ? new Date(data.inspectionDate).toISOString().split("T")[0] : "",
          startTime: data.startTime ? new Date(data.startTime).toTimeString().substring(0, 5) : "",
          endTime: data.endTime ? new Date(data.endTime).toTimeString().substring(0, 5) : "",
          grade: data.grade || parseInt(grade),
          totalMale: data.totalMale || 0,
          totalFemale: data.totalFemale || 0,
          totalAbsent: data.totalAbsent || 0,
          totalAbsentFemale: data.totalAbsentFemale || 0,
          inspectorName: data.inspectorName || "",
          inspectorPosition: data.inspectorPosition || "",
          inspectorOrganization: data.inspectorOrganization || "",
          academicYear: data.academicYear || "",
          semester: data.semester || 1,
          lessonDurationMinutes: data.lessonDurationMinutes || 45,
          generalNotes: data.generalNotes || "",
          selectedLevels: data.evaluationLevels || [],
          
          // Evaluation data
          evaluationData: data.evaluationRecords?.reduce((acc: any, rec: any) => {
            acc[`field_${rec.fieldId}`] = rec.scoreValue;
            return acc;
          }, {}) || {},
          evaluationComments: data.evaluationRecords?.reduce((acc: any, rec: any) => {
            if (rec.notes) {
              acc[`field_${rec.fieldId}`] = rec.notes;
            }
            return acc;
          }, {}) || {},
          
          // Student assessment
          studentAssessment: data.studentAssessmentSessions?.[0] ? {
            subjects: data.studentAssessmentSessions[0].subjects || [],
            students: data.studentAssessmentSessions[0].students || [],
            scores: data.studentAssessmentSessions[0].scores?.reduce((acc: any, score: any) => {
              const studentIndex = data.studentAssessmentSessions[0].students.findIndex(
                (s: any) => s.studentId === score.studentId
              );
              const subjectIndex = data.studentAssessmentSessions[0].subjects.findIndex(
                (s: any) => s.subjectId === score.subjectId
              );
              if (!acc[`student_${studentIndex}`]) {
                acc[`student_${studentIndex}`] = {};
              }
              acc[`student_${studentIndex}`][`subject_${subjectIndex}`] = score.score;
              return acc;
            }, {}) || {}
          } : prev.studentAssessment
        }));
        
        if (!isUnmountedRef.current) {
          setDataLoaded(true);
        }
      } else if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (!isUnmountedRef.current && error instanceof Error && error.name !== 'AbortError') {
        console.error("Error loading observation data:", error);
        showToast(language === 'km' ? 'មានបញ្ហាក្នុងការផ្ទុកទិន្នន័យ' : 'Error loading data', 'error');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [observationId, language]);

  const fetchFields = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    setLoading(true);
    
    try {
      // Create abort controller for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const response = await fetch("/api/master-fields-123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          grade: `G${grade}`,
          levels: formData.selectedLevels
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        if (!isUnmountedRef.current) {
          setFields(Array.isArray(data) ? data : []);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (!isUnmountedRef.current && error instanceof Error && error.name !== 'AbortError') {
        console.error("Error fetching fields:", error);
        showToast(language === 'km' ? 'មានបញ្ហាក្នុងការផ្ទុកវាល' : 'Error loading fields', 'error');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [subject, grade, formData.selectedLevels, language]);

  const fetchProvinces = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const response = await fetch("/api/geographic/provinces", {
        signal: abortControllerRef.current.signal
      });
      if (response.ok) {
        const data = await response.json();
        if (!isUnmountedRef.current) {
          setProvinces(Array.isArray(data.provinces) ? data.provinces : []);
        }
      }
    } catch (error) {
      if (!isUnmountedRef.current && error instanceof Error && error.name !== 'AbortError') {
        console.error("Error fetching provinces:", error);
        showToast(language === 'km' ? 'មានបញ្ហាក្នុងការផ្ទុកខេត្ត' : 'Error loading provinces', 'error');
      }
    }
  }, [language]);

  const fetchDistricts = async (provinceCode: string) => {
    try {
      const response = await fetch(`/api/geographic/districts?provinceCode=${provinceCode}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.districts || []);
        setCommunes([]); // Reset communes when province changes
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchCommunes = async (districtCode: string) => {
    try {
      const response = await fetch(`/api/geographic/communes?districtCode=${districtCode}`);
      if (response.ok) {
        const data = await response.json();
        setCommunes(data.communes || []);
        setVillages([]); // Reset villages when district changes
      }
    } catch (error) {
      console.error("Error fetching communes:", error);
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
      console.error("Error fetching villages:", error);
    }
  };

  const searchSchools = async (provinceCode: string) => {
    if (!provinceCode) {
      setSchools([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/schools/search?provinceCode=${provinceCode}`);
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      } else {
        console.error("School search failed:", response.status);
        setSchools([]);
      }
    } catch (error) {
      console.error("Failed to search schools:", error);
      setSchools([]);
    }
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    if (isUnmountedRef.current) return;
    
    setFormData(prev => {
      // Prevent unnecessary re-renders by checking if value actually changed
      if (prev[field as keyof typeof prev] === value) {
        return prev;
      }
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const handleLevelToggle = (level: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLevels: prev.selectedLevels.includes(level)
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level]
    }));
  };

  const handleConfirmLevelSelection = () => {
    if (formData.selectedLevels.length === 0) {
      alert(language === 'km' ? 'សូមជ្រើសរើសយ៉ាងហោចណាស់កម្រិតមួយ' : 'Please select at least one level');
      return;
    }
    setLevelSelectionConfirmed(true);
  };

  const handleChangeLevels = () => {
    setLevelSelectionConfirmed(false);
    setFields([]);
    setFormData(prev => ({
      ...prev,
      evaluationData: {},
      evaluationComments: {}
    }));
  };

  const handleEvaluationChange = (fieldId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationData: {
        ...prev.evaluationData,
        [`field_${fieldId}`]: value
      }
    }));
  };

  const handleCommentChange = (fieldId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      evaluationComments: {
        ...prev.evaluationComments,
        [`field_${fieldId}`]: value
      }
    }));
  };

  const handleStudentChange = (index: number, field: string, value: string) => {
    const newStudents = [...formData.studentAssessment.students];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        students: newStudents
      }
    }));
  };

  const handleScoreChange = (studentId: string, subjectId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        scores: {
          ...prev.studentAssessment.scores,
          [studentId]: {
            ...prev.studentAssessment.scores[studentId],
            [subjectId]: value
          }
        }
      }
    }));
  };

  const addStudent = () => {
    const newStudent = {
      id: `${formData.studentAssessment.students.length + 1}`,
      identifier: `សិស្សទី${formData.studentAssessment.students.length + 1}`,
      order: formData.studentAssessment.students.length + 1,
      name: "",
      gender: "M",
    };
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        students: [...prev.studentAssessment.students, newStudent]
      }
    }));
  };

  const removeStudent = (index: number) => {
    const newStudents = formData.studentAssessment.students.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        students: newStudents
      }
    }));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "LEVEL-1": return "#ff6b6b";
      case "LEVEL-2": return "#ffd93d";
      case "LEVEL-3": return "#6bcf7f";
      default: return "#e0e0e0";
    }
  };

  const calculateScore = (levelData: { [key: string]: string }) => {
    const total = Object.keys(levelData).length;
    const yes = Object.values(levelData).filter(v => v === "yes").length;
    return total > 0 ? Math.round((yes / total) * 100) : 0;
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return formData.school && formData.nameOfTeacher && formData.inspectorName;
      case 1: // Level Evaluation
        return levelSelectionConfirmed && Object.keys(formData.evaluationData).length > 0;
      case 2: // Student Assessment
        return true; // Optional step
      case 3: // AI Analysis
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = useCallback(async () => {
    if (saving || isUnmountedRef.current) return;
    
    setSaving(true);
    
    try {
      const url = mode === "edit" && observationId 
        ? `/api/observations/${observationId}`
        : "/api/observations";
      
      const method = mode === "edit" ? "PUT" : "POST";
      
      // Validate required fields
      if (!formData.nameOfTeacher?.trim() || !formData.school?.trim() || !formData.inspectorName?.trim()) {
        throw new Error('Required fields are missing');
      }
      
      // Prepare the data
      const requestData = {
        sessionInfo: formData,
        evaluationData: formData.evaluationData,
        studentAssessment: formData.studentAssessment
      };
      
      // Create abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const message = mode === "edit" 
          ? (language === 'km' ? 'បានកែប្រែដោយជោគជ័យ!' : 'Updated successfully!')
          : (language === 'km' ? 'រក្សាទុកដោយជោគជ័យ!' : 'Saved successfully!');
        
        showToast(message, 'success');
        setLastSaved(new Date());
        
        // Navigate after a short delay
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            router.push("/dashboard/observations");
          }
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      if (!isUnmountedRef.current && error instanceof Error && error.name !== 'AbortError') {
        console.error("Error saving:", error);
        
        // Implement retry logic for transient errors
        if (retryCount < MAX_RETRIES && (error.message.includes('network') || error.message.includes('timeout'))) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => handleSubmit(), 2000 * Math.pow(2, retryCount));
          showToast(language === 'km' ? 'កំពុងព្យាយាមម្តងទៀត...' : 'Retrying...', 'warning');
          return;
        }
        
        const message = mode === "edit"
          ? (language === 'km' ? 'មានបញ្ហាក្នុងការកែប្រែ' : 'Error updating')
          : (language === 'km' ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving');
        
        showToast(message, 'error');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setSaving(false);
      }
    }
  }, [mode, observationId, formData, saving, language, retryCount, router]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderLevelEvaluation();
      case 2:
        return renderStudentAssessment();
      case 3:
        return renderReviewSubmit();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <FadeIn delay={0.2}>
      <div className="space-y-6">
        <FormSection 
          title={language === 'km' ? 'ព័ត៌មានទីតាំង' : 'Location Information'}
          description={language === 'km' ? 'បំពេញព័ត៌មានទីតាំងសាលារៀន' : 'Fill in school location information'}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t("forms.province")}*</label>
          <select
            value={formData.provinceCode}
            onChange={(e) => {
              const selectedProvince = provinces.find(p => p.province_code?.toString() === e.target.value);
              if (selectedProvince) {
                handleInputChange('province', selectedProvince.province_name_en || '');
                handleInputChange('provinceCode', e.target.value);
                handleInputChange('provinceNameKh', selectedProvince.province_name_kh || '');
                // Reset dependent fields
                handleInputChange('district', '');
                handleInputChange('districtCode', '');
                handleInputChange('districtNameKh', '');
                handleInputChange('commune', '');
                handleInputChange('communeCode', '');
                handleInputChange('communeNameKh', '');
                handleInputChange('village', '');
                handleInputChange('villageCode', '');
                handleInputChange('villageNameKh', '');
                fetchDistricts(selectedProvince.province_code.toString());
                setSchools([]); // Reset schools when province changes
              }
            }}
            className={styles.select}
          >
                <option value="">ជ្រើសរើសខេត្ត/ក្រុង</option>
            {provinces.map(p => (
              <option key={p.province_code} value={p.province_code?.toString()}>
                {language === 'km' ? p.province_name_kh : p.province_name_en}
              </option>
            ))}
          </select>
        </div>

            <div className={styles.formGroup}>
              <label>{t("forms.district")}*</label>
          <select
            value={formData.districtCode}
            onChange={(e) => {
              const selectedDistrict = districts.find(d => d.district_code?.toString() === e.target.value);
              if (selectedDistrict) {
                handleInputChange('district', selectedDistrict.district_name_en || '');
                handleInputChange('districtCode', e.target.value);
                handleInputChange('districtNameKh', selectedDistrict.district_name_kh || '');
                // Reset dependent fields
                handleInputChange('commune', '');
                handleInputChange('communeCode', '');
                handleInputChange('communeNameKh', '');
                handleInputChange('village', '');
                handleInputChange('villageCode', '');
                handleInputChange('villageNameKh', '');
                fetchCommunes(selectedDistrict.district_code.toString());
              }
            }}
            className={styles.select}
            disabled={!formData.provinceCode}
          >
                <option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
            {districts.map(d => (
              <option key={d.district_code} value={d.district_code?.toString()}>
                {language === 'km' ? d.district_name_kh : d.district_name_en}
              </option>
            ))}
          </select>
        </div>

            <div className={styles.formGroup}>
              <label>{t("forms.commune")}</label>
          <select
            value={formData.communeCode}
            onChange={(e) => {
              const selectedCommune = communes.find(c => c.commune_code?.toString() === e.target.value);
              if (selectedCommune) {
                handleInputChange('commune', selectedCommune.commune_name_en || '');
                handleInputChange('communeCode', e.target.value);
                handleInputChange('communeNameKh', selectedCommune.commune_name_kh || '');
                // Reset dependent fields
                handleInputChange('village', '');
                handleInputChange('villageCode', '');
                handleInputChange('villageNameKh', '');
                fetchVillages(selectedCommune.commune_code.toString());
              }
            }}
            className={styles.select}
            disabled={!formData.districtCode}
          >
                <option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
            {communes.map(c => (
              <option key={c.commune_code} value={c.commune_code?.toString()}>
                {language === 'km' ? c.commune_name_kh : c.commune_name_en}
              </option>
            ))}
          </select>
        </div>

            <div className={styles.formGroup}>
              <label>{t("forms.village")}</label>
          <select
            value={formData.villageCode}
            onChange={(e) => {
              const selectedVillage = villages.find(v => v.village_code === e.target.value);
              if (selectedVillage) {
                handleInputChange('village', selectedVillage.village_name_en || '');
                handleInputChange('villageCode', e.target.value);
                handleInputChange('villageNameKh', selectedVillage.village_name_kh || '');
              }
            }}
            className={styles.select}
            disabled={!formData.communeCode}
          >
                <option value="">ជ្រើសរើសភូមិ</option>
            {villages.map(v => (
              <option key={v.village_code} value={v.village_code}>
                {language === 'km' ? v.village_name_kh : v.village_name_en}
              </option>
            ))}
          </select>
        </div>

            <div className={styles.formGroup}>
              <label>{t("forms.school")}*</label>
          <select
            value={formData.schoolId || ''}
            onChange={(e) => {
              const selectedSchool = schools.find(s => s.id === parseInt(e.target.value));
              if (selectedSchool) {
                handleInputChange('school', selectedSchool.name || '');
                handleInputChange('schoolId', selectedSchool.id);
              }
            }}
            className={styles.select}
            disabled={!formData.provinceCode}
          >
                <option value="">ជ្រើសរើសសាលារៀន</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>
        </div>

            <div className={styles.formGroup}>
              <label>{t("forms.cluster")}</label>
          <input
            type="text"
            value={formData.cluster}
            onChange={(e) => handleInputChange('cluster', e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលបណ្តុំសាលា' : 'Enter cluster'}
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title={language === 'km' ? 'ព័ត៌មានគ្រូបង្រៀន' : 'Teacher Information'}
          description={language === 'km' ? 'បំពេញព័ត៌មានអំពីគ្រូបង្រៀន' : 'Fill in teacher information'}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t("observations.teacher")}*</label>
          <input
            type="text"
            value={formData.nameOfTeacher}
            onChange={(e) => handleInputChange('nameOfTeacher', e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះគ្រូ' : 'Enter teacher name'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === "km" ? "ភេទ" : "Gender"}*</label>
          <select
            value={formData.sex}
            onChange={(e) => handleInputChange('sex', e.target.value)}
            className={styles.select}
          >
                <option value="M">{language === 'km' ? 'ប្រុស' : 'Male'}</option>
                <option value="F">{language === 'km' ? 'ស្រី' : 'Female'}</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>{t("teachers.employmentType")}*</label>
          <select
            value={formData.employmentType}
            onChange={(e) => handleInputChange('employmentType', e.target.value)}
            className={styles.select}
          >
                <option value="official">{getEmploymentTypeLabel('official')}</option>
                <option value="contract">{getEmploymentTypeLabel('contract')}</option>
                <option value="volunteer">{getEmploymentTypeLabel('volunteer')}</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection 
          title={t("forms.sessionInfo")}
          description={language === 'km' ? 'ព័ត៌មានអំពីមេរៀនដែលបង្រៀន' : 'Information about the lesson taught'}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t("observations.sessionTime")}*</label>
          <select
            value={formData.sessionTime}
            onChange={(e) => handleInputChange('sessionTime', e.target.value)}
            className={styles.select}
          >
                <option value="morning">{getSessionTimeLabel('morning')}</option>
                <option value="afternoon">{getSessionTimeLabel('afternoon')}</option>
                <option value="full_day">{getSessionTimeLabel('full_day')}</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>{t("observations.chapter")}</label>
          <input
            type="text"
            value={formData.chapter}
            onChange={(e) => handleInputChange('chapter', e.target.value)}
                placeholder={language === 'km' ? 'លេខជំពូក' : 'Chapter number'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t("observations.lesson")}</label>
          <input
            type="text"
            value={formData.lesson}
            onChange={(e) => handleInputChange('lesson', e.target.value)}
                placeholder={language === 'km' ? 'លេខមេរៀន' : 'Lesson number'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === "km" ? "ចំណងជើងមេរៀន" : "Lesson Title"}</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={language === 'km' ? 'ចំណងជើងមេរៀន' : 'Lesson title'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === "km" ? "ចំណងជើងរង" : "Subtitle"}</label>
              <input
                type="text"
                value={formData.subTitle}
                onChange={(e) => handleInputChange('subTitle', e.target.value)}
                placeholder={language === 'km' ? 'ចំណងជើងរង' : 'Lesson subtitle'}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t("common.date")}*</label>
          <input
            type="date"
            value={formData.inspectionDate}
            onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t("observations.startTime")}</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t("observations.endTime")}</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t("forms.academicYear")}</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => handleInputChange('academicYear', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t("forms.semester")}</label>
              <select
                value={formData.semester}
                onChange={(e) => handleInputChange('semester', parseInt(e.target.value))}
              >
                <option value={1}>{language === 'km' ? 'ឆមាសទី ១' : 'Semester 1'}</option>
                <option value={2}>{language === 'km' ? 'ឆមាសទី ២' : 'Semester 2'}</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>
                {t("observations.duration")} ({language === "km" ? "នាទី" : "minutes"})
              </label>
              <input
                type="number"
                value={formData.lessonDurationMinutes}
                onChange={(e) => handleInputChange('lessonDurationMinutes', parseInt(e.target.value) || 45)}
                min="15"
                max="240"
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title={language === 'km' ? 'ព័ត៌មានសិស្ស' : 'Student Information'}
          description={language === 'km' ? 'ព័ត៌មានអំពីចំនួនសិស្ស' : 'Information about student numbers'}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'សិស្សប្រុសសរុប' : 'Total Male Students'}</label>
          <input
            type="number"
            value={formData.totalMale}
            onChange={(e) => handleInputChange('totalMale', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'សិស្សស្រីសរុប' : 'Total Female Students'}</label>
          <input
            type="number"
            value={formData.totalFemale}
            onChange={(e) => handleInputChange('totalFemale', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'សិស្សសរុប' : 'Total Students'}</label>
              <input
                type="number"
                value={formData.totalMale + formData.totalFemale}
                disabled
                className={styles.readOnlyInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'អវត្តមានសរុប' : 'Total Absent'}</label>
          <input
            type="number"
            value={formData.totalAbsent}
            onChange={(e) => handleInputChange('totalAbsent', parseInt(e.target.value) || 0)}
                min="0"
                max={formData.totalMale + formData.totalFemale}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'អវត្តមានស្រី' : 'Absent Female'}</label>
          <input
            type="number"
            value={formData.totalAbsentFemale}
            onChange={(e) => handleInputChange('totalAbsentFemale', parseInt(e.target.value) || 0)}
                min="0"
                max={formData.totalFemale}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'សិស្សមករៀន' : 'Present Students'}</label>
              <input
                type="number"
                value={formData.totalMale + formData.totalFemale - formData.totalAbsent}
                disabled
                className={styles.readOnlyInput}
              />
            </div>
          </div>
        </FormSection>

        <FormSection 
          title={language === 'km' ? 'ព័ត៌មានអ្នកត្រួតពិនិត្យ' : 'Inspector Information'}
          description={language === 'km' ? 'ព័ត៌មានអ្នកធ្វើការត្រួតពិនិត្យ' : 'Information about the inspector'}
          collapsible={true}
          defaultOpen={false}
        >
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'ឈ្មោះអ្នកត្រួតពិនិត្យ' : 'Inspector Name'}</label>
          <input
            type="text"
            value={formData.inspectorName}
            onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះអ្នកត្រួតពិនិត្យ' : 'Enter inspector name'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'តួនាទី' : 'Position'}</label>
          <input
            type="text"
            value={formData.inspectorPosition}
            onChange={(e) => handleInputChange('inspectorPosition', e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលតួនាទី' : 'Enter position'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{language === 'km' ? 'ស្ថាប័ន' : 'Organization'}</label>
          <input
            type="text"
            value={formData.inspectorOrganization}
            onChange={(e) => handleInputChange('inspectorOrganization', e.target.value)}
                placeholder={language === 'km' ? 'បញ្ចូលស្ថាប័ន' : 'Enter organization'}
              />
            </div>
          </div>
        </FormSection>
      </div>
    </FadeIn>
  );

  const renderLevelEvaluation = () => (
    <div className={styles.section}>
      <h2>{t('forms.teachingEvaluation')}</h2>
      
      <div className={styles.levelSelection}>
        <p className={styles.sectionDescription}>
          {language === 'km' ? 'ជ្រើសរើសកម្រិតវាយតម្លៃ:' : 'Select evaluation level(s):'}
        </p>
          
        <div className={styles.levelOptions}>
          {["LEVEL-1", "LEVEL-2", "LEVEL-3"].map((level, index) => (
            <label key={level} className={styles.levelCheckbox}>
              <input
                type="checkbox"
                checked={formData.selectedLevels.includes(level)}
                onChange={() => handleLevelToggle(level)}
              />
              <span
                className={styles.levelTag}
                style={{ backgroundColor: getLevelColor(level) }}
              >
                {language === 'km' 
                  ? `កម្រិត ${index + 1} - ${index === 0 ? 'មូលដ្ឋាន' : index === 1 ? 'មធ្យម' : 'ខ្ពស់'}`
                  : `Level ${index + 1} - ${index === 0 ? 'Basic' : index === 1 ? 'Intermediate' : 'Advanced'}`
                }
              </span>
            </label>
          ))}
        </div>
      </div>

      {levelSelectionConfirmed && (
        <div className={styles.evaluationGrid}>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              {language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}
            </div>
          ) : (
            formData.selectedLevels.map(level => {
              const levelFields = fields.filter(f => f.level === level);
              const levelIndex = parseInt(level.replace('LEVEL-', '')) - 1;

              return levelFields.map((field, index) => (
                <div key={field.id} className={styles.evaluationItem}>
                  <div className={styles.evaluationHeader}>
                    <span
                      className={styles.levelBadge}
                      style={{
                        backgroundColor: getLevelColor(level)
                      }}
                    >
                      {language === 'km' ? `កម្រិត ${levelIndex + 1}` : `Level ${levelIndex + 1}`}
                    </span>
                    <h3>{field.indicator}</h3>
                    {field.activity && <p>{field.activity}</p>}
                  </div>

                  <div className={styles.ratingOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`eval_${field.id}`}
                        value="yes"
                        checked={formData.evaluationData[`field_${field.id}`] === "yes"}
                        onChange={() => handleEvaluationChange(field.id, "yes")}
                      />
                      <span
                        className={styles.radioLabel}
                        style={{ color: "#52c41a" }}
                      >
                        Yes / បាទ/ចាស
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`eval_${field.id}`}
                        value="some_practice"
                        checked={formData.evaluationData[`field_${field.id}`] === "some_practice"}
                        onChange={() => handleEvaluationChange(field.id, "some_practice")}
                      />
                      <span
                        className={styles.radioLabel}
                        style={{ color: "#faad14" }}
                      >
                        Some Practice / អនុវត្តខ្លះ
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`eval_${field.id}`}
                        value="no"
                        checked={formData.evaluationData[`field_${field.id}`] === "no"}
                        onChange={() => handleEvaluationChange(field.id, "no")}
                      />
                      <span
                        className={styles.radioLabel}
                        style={{ color: "#ff4d4f" }}
                      >
                        No / ទេ
                      </span>
                    </label>
                  </div>

                  <div className={styles.commentSection}>
                    <label>{language === 'km' ? 'បរិបទ AI និងមតិយោបល់' : 'AI Context & Comments'}</label>
                    <textarea
                      value={formData.evaluationComments[`field_${field.id}`] || ""}
                      onChange={(e) => handleCommentChange(field.id, e.target.value)}
                      placeholder={
                        field.note ||
                        (language === 'km' ? 'បន្ថែមការសង្កេត ឬមតិយោបល់ជាក់លាក់...' : 'Add any specific observations or feedback...')
                      }
                      rows={2}
                    />
                  </div>
                </div>
              ));
            })
          )}
        </div>
      )}

      {formData.selectedLevels.length === 0 && (
        <div className={styles.noIndicators}>
          <p>
            {language === 'km' ? 'សូមជ្រើសរើសកម្រិតវាយតម្លៃយ៉ាងហោចណាស់មួយដើម្បីមើលសូចនាករ។' : 'Please select at least one evaluation level to see indicators.'}
          </p>
        </div>
      )}
    </div>
  );

  const renderStudentAssessment = () => (
    <div className={styles.section}>
      <h2>{t('forms.studentAssessment')}</h2>
      <p className={styles.sectionDescription}>
        {language === 'km' ? 'វាយតម្លៃគំរូសិស្សតាមមុខវិជ្ជាផ្សេងៗ (ស្រេចចិត្ត)' : 'Evaluate a sample of students across different subjects (optional)'}
      </p>

      <div className={styles.assessmentTable}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '30%', textAlign: 'left', paddingLeft: '20px' }}>
                {language === 'km' ? 'សិស្ស' : 'Student'}
              </th>
              {formData.studentAssessment.subjects.map(subject => (
                <th key={subject.id}>
                  <div className={assessmentStyles.subjectHeader}>
                    <span className={assessmentStyles.subjectName}>
                      {language === 'km' ? subject.name_km : subject.name_en}
                    </span>
                    <span className={assessmentStyles.maxScore}>
                      ({language === 'km' ? 'អតិបរមា' : 'Max'}: {subject.max_score})
                    </span>
                  </div>
                </th>
              ))}
              <th style={{ width: '80px' }}>
                {language === 'km' ? 'សកម្មភាព' : 'Action'}
              </th>
            </tr>
          </thead>
          <tbody>
            {formData.studentAssessment.students.map((student, index) => {
              const studentScores = formData.studentAssessment.scores[student.id || ''] || {};

              return (
                <tr key={student.id}>
                  <td>
                    <div className={assessmentStyles.studentCell}>
                      <div className={assessmentStyles.studentIdentifier}>
                        <span className={assessmentStyles.studentLabel}>
                          {language === 'km' ? `សិស្សទី${index + 1} -` : `Student ${index + 1} -`}
                        </span>
                        <input
                          type="text"
                          value={student.identifier || ''}
                          onChange={(e) => handleStudentChange(index, 'identifier', e.target.value)}
                          placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះ' : 'Enter name'}
                          className={assessmentStyles.studentInput}
                        />
                      </div>
                      <select
                        value={student.gender}
                        onChange={(e) => handleStudentChange(index, 'gender', e.target.value)}
                        className={assessmentStyles.genderSelect}
                      >
                        <option value="M">{language === 'km' ? 'ប្រុស' : 'Male'}</option>
                        <option value="F">{language === 'km' ? 'ស្រី' : 'Female'}</option>
                      </select>
                    </div>
                  </td>
                  {formData.studentAssessment.subjects.map(subject => (
                    <td key={subject.id}>
                      <input
                        type="number"
                        min="0"
                        max={subject.max_score}
                        step="0.5"
                        value={studentScores[subject.id || ''] || ''}
                        onChange={(e) => 
                          handleScoreChange(student.id || '', subject.id || '', parseFloat(e.target.value) || 0)
                        }
                        className={assessmentStyles.scoreInput}
                      />
                    </td>
                  ))}
                  <td className={assessmentStyles.actionCell}>
                    <button
                      onClick={() => removeStudent(index)}
                      className={assessmentStyles.removeButton}
                      title={language === 'km' ? 'លុបសិស្ស' : 'Remove student'}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className={assessmentStyles.buttonGroup}>
        <button 
          onClick={() => {
            const newStudents = Array.from({ length: 5 }, (_, i) => ({
              id: `${Date.now()}_${i}`,
              identifier: '',
              order: formData.studentAssessment.students.length + i + 1,
              name: '',
              gender: i % 2 === 0 ? 'M' : 'F'
            }));
            setFormData(prev => ({
              ...prev,
              studentAssessment: {
                ...prev.studentAssessment,
                students: [...prev.studentAssessment.students, ...newStudents]
              }
            }));
          }}
          className={`${assessmentStyles.addButton} ${assessmentStyles.addButtonPrimary}`}
        >
          + {language === 'km' ? 'បន្ថែមសិស្ស ៥ នាក់' : 'Add 5 Students'}
        </button>
        <button 
          onClick={addStudent}
          className={`${assessmentStyles.addButton} ${assessmentStyles.addButtonSecondary}`}
        >
          + {language === 'km' ? 'បន្ថែមសិស្ស ១ នាក់' : 'Add 1 Student'}
        </button>
      </div>
    </div>
  );

  const renderReviewSubmit = () => (
    <div className={styles.section}>
      <h2>{language === 'km' ? 'ពិនិត្យ និងដាក់ស្នើ' : 'Review & Submit'}</h2>
      
      {/* Session Summary */}
      <div className={styles.reviewSection}>
        <h3>{language === 'km' ? 'សង្ខេបវគ្គ' : 'Session Summary'}</h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <label>{language === 'km' ? 'សាលារៀន:' : 'School:'}</label>
            <span>{formData.school || '-'}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>{language === 'km' ? 'គ្រូបង្រៀន:' : 'Teacher:'}</label>
            <span>{formData.nameOfTeacher || '-'}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>{language === 'km' ? 'មុខវិជ្ជា:' : 'Subject:'}</label>
            <span>{subjectNames[subject][language]} - {gradeNames[grade][language]}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>{language === 'km' ? 'កាលបរិច្ឆេទ:' : 'Date:'}</label>
            <span>{formData.inspectionDate}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>{language === 'km' ? 'សិស្ស:' : 'Students:'}</label>
            <span>
              {formData.totalMale + formData.totalFemale - formData.totalAbsent} {language === 'km' ? 'មករៀន' : 'present'} / 
              {' '}{formData.totalMale + formData.totalFemale} {language === 'km' ? 'សរុប' : 'total'}
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation Summary */}
      <div className={styles.reviewSection}>
        <h3>{language === 'km' ? 'សង្ខេបការវាយតម្លៃ' : 'Evaluation Summary'}</h3>
        <div className={styles.evaluationSummary}>
          {formData.selectedLevels.length > 0 ? (
            <div className={styles.summaryList}>
              {formData.selectedLevels.map(level => {
                const levelFields = fields.filter(f => f.level === level);
                const levelData = Object.entries(formData.evaluationData)
                  .filter(([key]) => {
                    const fieldId = key.replace('field_', '');
                    return levelFields.some(f => f.id.toString() === fieldId);
                  });

                const yesCount = levelData.filter(([_, value]) => value === 'yes').length;
                const someCount = levelData.filter(([_, value]) => value === 'some_practice').length;
                const noCount = levelData.filter(([_, value]) => value === 'no').length;

                return (
                  <div key={level} className={styles.summaryEvalItem}>
                    <span style={{ color: getLevelColor(level), fontWeight: 'bold' }}>
                      {level.replace('LEVEL-', language === 'km' ? 'កម្រិត ' : 'Level ')}:
                    </span>
                    <div style={{ marginLeft: '20px' }}>
                      <span style={{ color: '#52c41a' }}>
                        {language === 'km' ? 'បាទ/ចាស' : 'Yes'}: {yesCount}
                      </span>
                      {' | '}
                      <span style={{ color: '#faad14' }}>
                        {language === 'km' ? 'អនុវត្តខ្លះ' : 'Some Practice'}: {someCount}
                      </span>
                      {' | '}
                      <span style={{ color: '#ff4d4f' }}>
                        {language === 'km' ? 'ទេ' : 'No'}: {noCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>{language === 'km' ? 'មិនមានទិន្ននន័យវាយតម្លៃ' : 'No evaluation data entered'}</p>
          )}
        </div>
      </div>

      {/* General Notes */}
      <div className={styles.reviewSection}>
        <h3>{language === 'km' ? 'កំណត់ចំណាំទូទៅ' : 'General Notes'}</h3>
        <textarea
          value={formData.generalNotes}
          onChange={(e) => handleInputChange('generalNotes', e.target.value)}
          placeholder={language === 'km' ? 'បន្ថែមការសង្កេត ឬអនុសាសន៍បន្ថែម...' : 'Add any additional observations or recommendations...'}
          rows={4}
          className={styles.fullWidthTextarea}
        />
      </div>

      {/* AI Analysis */}
      <div className={styles.reviewSection}>
        <AIAnalysis 
          observationData={{
            ...formData,
            masterFields: fields  // Include master fields for indicator descriptions
          }} 
          language={language}
          disabled={saving || loading}
          onAnalysisComplete={(result) => {
            console.log('Analysis completed:', result);
          }}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/dashboard/observations')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#007bff',
                border: '2px solid #007bff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#007bff';
              }}
            >
              ← {language === 'km' ? 'ត្រឡប់' : 'Back'}
            </button>
            <h1 style={{ margin: 0 }}>
              {mode === 'edit' 
                ? (language === 'km' 
                  ? `កែប្រែទម្រង់អង្កេត ${subjectNames[subject].km} - ${gradeNames[grade].km}`
                  : `Edit ${subjectNames[subject].en} - ${gradeNames[grade].en} Observation`)
                : (language === 'km' 
                  ? `ទម្រង់អង្កេត ${subjectNames[subject].km} - ${gradeNames[grade].km}`
                  : `${subjectNames[subject].en} - ${gradeNames[grade].en} Observation Form`)
              }
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/dashboard/observations/select')}
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
              🔄 {language === 'km' ? 'ជ្រើសរើសទម្រង់ផ្សេង' : 'Select Different Form'}
            </button>
            <button
              onClick={() => router.push('/dashboard/observations')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
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
                e.currentTarget.style.backgroundColor = '#218838';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
              }}
            >
              📋 {language === 'km' ? 'បញ្ជីអង្កេតទាំងអស់' : 'All Observations'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`${styles.step} ${index === currentStep ? styles.active : ""} ${index < currentStep ? styles.completed : ""}`}
          >
            <div className={styles.stepNumber}>{index + 1}</div>
            <div className={styles.stepTitle}>{step.title}</div>
          </div>
        ))}
      </div>

      <div className={styles.formContainer}>
        {renderStep()}
      </div>

      <FadeIn delay={0.4}>
        <div className="flex justify-between items-center mt-8 p-6 bg-white rounded-lg border border-gray-200">
          {currentStep > 0 && (
            <AnimatedButton
              variant="secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← {t('common.previous')}
            </AnimatedButton>
          )}
          <div className="flex-1" />
          {currentStep < stepTitles.length - 1 ? (
            <AnimatedButton
              variant="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!isStepValid()}
            >
              {t('common.next')} →
            </AnimatedButton>
          ) : (
            <AnimatedButton
              variant="success"
              onClick={handleSubmit}
              disabled={!isStepValid()}
              loading={saving}
            >
              {mode === "edit" 
                ? (language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Update Observation')
                : (language === 'km' ? 'ដាក់ស្នើការសង្កេត' : 'Submit Observation')
              }
            </AnimatedButton>
          )}
        </div>
      </FadeIn>
    </div>
  );
}