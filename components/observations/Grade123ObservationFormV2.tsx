"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";
import AIAnalysis from "@/components/ai/AIAnalysis";
import styles from "@/app/dashboard/observations/new/new-observation.module.css";

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

  const subjectNames = {
    KH: { en: "Khmer Language", km: "ភាសាខ្មែរ" },
    MATH: { en: "Mathematics", km: "គណិតវិទ្យា" }
  };

  const gradeNames = {
    "1": { en: "Grade 1", km: "ថ្នាក់ទី១" },
    "2": { en: "Grade 2", km: "ថ្នាក់ទី២" },
    "3": { en: "Grade 3", km: "ថ្នាក់ទី៣" }
  };

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

  // Fetch location data on mount
  useEffect(() => {
    fetchProvinces();
    
    // Load observation data if in edit mode
    if (mode === "edit" && observationId && !dataLoaded) {
      loadObservationData();
    }
  }, [mode, observationId]);

  // Fetch fields when levels are selected
  useEffect(() => {
    if (levelSelectionConfirmed && formData.selectedLevels.length > 0) {
      fetchFields();
    }
  }, [levelSelectionConfirmed, formData.selectedLevels]);

  // Search schools when province changes
  useEffect(() => {
    if (formData.provinceCode) {
      searchSchools(formData.provinceCode);
    }
  }, [formData.provinceCode]);

  const loadObservationData = async () => {
    if (!observationId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/observations/${observationId}`);
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
        
        setDataLoaded(true);
      }
    } catch (error) {
      console.error("Error loading observation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/master-fields-123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          grade: `G${grade}`,
          levels: formData.selectedLevels
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFields(data);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await fetch("/api/geographic/provinces");
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces || []);
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = mode === "edit" && observationId 
        ? `/api/observations/${observationId}`
        : "/api/observations";
      
      const method = mode === "edit" ? "PUT" : "POST";
      
      // Prepare the data based on the mode
      const requestData = mode === "edit" ? {
        sessionInfo: formData,
        evaluationData: formData.evaluationData,
        studentAssessment: formData.studentAssessment
      } : {
        sessionInfo: formData,
        evaluationData: formData.evaluationData,
        studentAssessment: formData.studentAssessment
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const message = mode === "edit" 
          ? (language === 'km' ? 'បានកែប្រែដោយជោគជ័យ!' : 'Updated successfully!')
          : (language === 'km' ? 'រក្សាទុកដោយជោគជ័យ!' : 'Saved successfully!');
        alert(message);
        router.push("/dashboard/observations");
      }
    } catch (error) {
      console.error("Error saving:", error);
      const message = mode === "edit"
        ? (language === 'km' ? 'មានបញ្ហាក្នុងការកែប្រែ' : 'Error updating')
        : (language === 'km' ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving');
      alert(message);
    } finally {
      setSaving(false);
    }
  };

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
    <div className={styles.section}>
      <h2>{t('forms.basicInfo')}</h2>
      
      {/* Location Selection */}
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ខេត្ត' : 'Province'}*</label>
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
            <option value="">{language === 'km' ? 'ជ្រើសរើសខេត្ត' : 'Select Province'}</option>
            {provinces.map(p => (
              <option key={p.province_code} value={p.province_code?.toString()}>
                {language === 'km' ? p.province_name_kh : p.province_name_en}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ស្រុក' : 'District'}*</label>
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
            <option value="">{language === 'km' ? 'ជ្រើសរើសស្រុក' : 'Select District'}</option>
            {districts.map(d => (
              <option key={d.district_code} value={d.district_code?.toString()}>
                {language === 'km' ? d.district_name_kh : d.district_name_en}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ឃុំ' : 'Commune'}</label>
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
            <option value="">{language === 'km' ? 'ជ្រើសរើសឃុំ' : 'Select Commune'}</option>
            {communes.map(c => (
              <option key={c.commune_code} value={c.commune_code?.toString()}>
                {language === 'km' ? c.commune_name_kh : c.commune_name_en}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ភូមិ' : 'Village'}</label>
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
            <option value="">{language === 'km' ? 'ជ្រើសរើសភូមិ' : 'Select Village'}</option>
            {villages.map(v => (
              <option key={v.village_code} value={v.village_code}>
                {language === 'km' ? v.village_name_kh : v.village_name_en}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'សាលារៀន' : 'School'}*</label>
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
            <option value="">{language === 'km' ? 'ជ្រើសរើសសាលា' : 'Select School'}</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ក្លាស្ទ័រ' : 'Cluster'}</label>
          <input
            type="text"
            value={formData.cluster}
            onChange={(e) => handleInputChange('cluster', e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      {/* Teacher Information */}
      <h3>{language === 'km' ? 'ព័ត៌មានគ្រូ' : 'Teacher Information'}</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ឈ្មោះគ្រូ' : 'Teacher Name'}</label>
          <input
            type="text"
            value={formData.nameOfTeacher}
            onChange={(e) => handleInputChange('nameOfTeacher', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ភេទ' : 'Gender'}</label>
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
          <label>{language === 'km' ? 'ប្រភេទការងារ' : 'Employment Type'}</label>
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

      {/* Session Information */}
      <h3>{language === 'km' ? 'ព័ត៌មានវគ្គសិក្សា' : 'Session Information'}</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ពេលសិក្សា' : 'Session Time'}</label>
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
          <label>{language === 'km' ? 'ជំពូក' : 'Chapter'}</label>
          <input
            type="text"
            value={formData.chapter}
            onChange={(e) => handleInputChange('chapter', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'មេរៀន' : 'Lesson'}</label>
          <input
            type="text"
            value={formData.lesson}
            onChange={(e) => handleInputChange('lesson', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ចំណងជើង' : 'Title'}</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}</label>
          <input
            type="date"
            value={formData.inspectionDate}
            onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ម៉ោងចាប់ផ្តើម' : 'Start Time'}</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ម៉ោងបញ្ចប់' : 'End Time'}</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      {/* Student Statistics */}
      <h3>{language === 'km' ? 'ស្ថិតិសិស្ស' : 'Student Statistics'}</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'សិស្សប្រុសសរុប' : 'Total Male Students'}</label>
          <input
            type="number"
            value={formData.totalMale}
            onChange={(e) => handleInputChange('totalMale', parseInt(e.target.value) || 0)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'សិស្សស្រីសរុប' : 'Total Female Students'}</label>
          <input
            type="number"
            value={formData.totalFemale}
            onChange={(e) => handleInputChange('totalFemale', parseInt(e.target.value) || 0)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'អវត្តមានសរុប' : 'Total Absent'}</label>
          <input
            type="number"
            value={formData.totalAbsent}
            onChange={(e) => handleInputChange('totalAbsent', parseInt(e.target.value) || 0)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'អវត្តមានស្រី' : 'Female Absent'}</label>
          <input
            type="number"
            value={formData.totalAbsentFemale}
            onChange={(e) => handleInputChange('totalAbsentFemale', parseInt(e.target.value) || 0)}
            className={styles.input}
          />
        </div>
      </div>

      {/* Inspector Information */}
      <h3>{language === 'km' ? 'ព័ត៌មានអ្នកត្រួតពិនិត្យ' : 'Inspector Information'}</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ឈ្មោះអ្នកត្រួតពិនិត្យ' : 'Inspector Name'}</label>
          <input
            type="text"
            value={formData.inspectorName}
            onChange={(e) => handleInputChange('inspectorName', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'តួនាទី' : 'Position'}</label>
          <input
            type="text"
            value={formData.inspectorPosition}
            onChange={(e) => handleInputChange('inspectorPosition', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{language === 'km' ? 'ស្ថាប័ន' : 'Organization'}</label>
          <input
            type="text"
            value={formData.inspectorOrganization}
            onChange={(e) => handleInputChange('inspectorOrganization', e.target.value)}
            className={styles.input}
          />
        </div>
      </div>
    </div>
  );

  const renderLevelEvaluation = () => (
    <div className={styles.section}>
      <h2>{language === 'km' ? 'វាយតម្លៃតាមកម្រិត' : 'Level-based Evaluation'}</h2>
      
      {/* Level Selection */}
      {!levelSelectionConfirmed ? (
        <div style={{ 
          backgroundColor: "#f0f8ff",
          padding: "30px",
          borderRadius: "12px",
          marginBottom: "30px"
        }}>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
            {language === 'km' ? 'ជ្រើសរើសកម្រិតដែលចង់វាយតម្លៃ' : 'Select Levels to Evaluate'}
          </h3>
          
          <div style={{ 
            display: "flex", 
            gap: "20px", 
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "30px"
          }}>
            {["LEVEL-1", "LEVEL-2", "LEVEL-3"].map((level, index) => (
              <label
                key={level}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px",
                  backgroundColor: formData.selectedLevels.includes(level) ? getLevelColor(level) : "#fff",
                  color: formData.selectedLevels.includes(level) ? "#fff" : "#333",
                  borderRadius: "12px",
                  border: `3px solid ${getLevelColor(level)}`,
                  cursor: "pointer",
                  minWidth: "150px"
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.selectedLevels.includes(level)}
                  onChange={() => handleLevelToggle(level)}
                  style={{ display: "none" }}
                />
                <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                  {index === 0 ? "1️⃣" : index === 1 ? "2️⃣" : "3️⃣"}
                </div>
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                  {language === 'km' ? `កម្រិតទី ${index + 1}` : `Level ${index + 1}`}
                </span>
              </label>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleConfirmLevelSelection}
              disabled={formData.selectedLevels.length === 0}
              className={styles.primaryButton}
            >
              {language === 'km' ? 'បន្តទៅវាយតម្លៃ' : 'Continue to Evaluation'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Selected Levels Banner */}
          <div style={{ 
            backgroundColor: "#e8f5e9",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <strong>{language === 'km' ? 'កម្រិតដែលបានជ្រើសរើស:' : 'Selected Levels:'}</strong> {' '}
              {formData.selectedLevels.map(level => level.replace('LEVEL-', 'Level ')).join(', ')}
            </div>
            <button onClick={handleChangeLevels} className={styles.secondaryButton}>
              {language === 'km' ? '🔄 ប្តូរកម្រិត' : '🔄 Change Levels'}
            </button>
          </div>

          {/* Evaluation Fields */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              {language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}
            </div>
          ) : (
            formData.selectedLevels.map(level => {
              const levelFields = fields.filter(f => f.level === level);
              const levelData = Object.entries(formData.evaluationData)
                .filter(([key]) => {
                  const fieldId = key.replace('field_', '');
                  return levelFields.some(f => f.id.toString() === fieldId);
                })
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

              return (
                <div key={level} style={{ marginBottom: "30px" }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "15px",
                    padding: "10px",
                    backgroundColor: getLevelColor(level),
                    color: "white",
                    borderRadius: "8px"
                  }}>
                    <h3 style={{ margin: 0, flex: 1 }}>
                      {language === 'km' ? `កម្រិតទី ${level.replace('LEVEL-', '')}` : level.replace('-', ' ')}
                    </h3>
                    <div style={{ 
                      backgroundColor: "rgba(255,255,255,0.3)", 
                      padding: "5px 15px", 
                      borderRadius: "20px",
                      fontWeight: "bold"
                    }}>
                      {calculateScore(levelData)}%
                    </div>
                  </div>
                  
                  {levelFields.map((field, index) => (
                    <div key={field.id} className={styles.evaluationItem}>
                      <div className={styles.evaluationHeader}>
                        <span className={styles.evaluationNumber}>#{index + 1}</span>
                        <span className={styles.evaluationIndicator}>{field.indicator}</span>
                      </div>
                      
                      <div className={styles.evaluationOptions}>
                        <label>
                          <input
                            type="radio"
                            name={`eval_${field.id}`}
                            value="yes"
                            checked={formData.evaluationData[`field_${field.id}`] === "yes"}
                            onChange={() => handleEvaluationChange(field.id, "yes")}
                          />
                          <span>{language === 'km' ? 'បាទ/ចាស' : 'Yes'}</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`eval_${field.id}`}
                            value="no"
                            checked={formData.evaluationData[`field_${field.id}`] === "no"}
                            onChange={() => handleEvaluationChange(field.id, "no")}
                          />
                          <span>{language === 'km' ? 'ទេ' : 'No'}</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`eval_${field.id}`}
                            value="na"
                            checked={formData.evaluationData[`field_${field.id}`] === "na"}
                            onChange={() => handleEvaluationChange(field.id, "na")}
                          />
                          <span>{language === 'km' ? 'មិនពាក់ព័ន្ធ' : 'N/A'}</span>
                        </label>
                      </div>
                      
                      <input
                        type="text"
                        placeholder={language === 'km' ? 'មតិយោបល់...' : 'Comments...'}
                        value={formData.evaluationComments[`field_${field.id}`] || ""}
                        onChange={(e) => handleCommentChange(field.id, e.target.value)}
                        className={styles.commentInput}
                      />
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );

  const renderStudentAssessment = () => (
    <div className={styles.section}>
      <h2>{language === 'km' ? 'ការវាយតម្លៃសិស្ស' : 'Student Assessment'}</h2>
      <p className={styles.sectionDescription}>
        {language === 'km' 
          ? 'វាយតម្លៃគំរូសិស្សតាមមុខវិជ្ជាផ្សេងៗ (ស្រេចចិត្ត)' 
          : 'Evaluate a sample of students across different subjects (optional)'}
      </p>
      
      <div className={styles.assessmentTable}>
        <table>
          <thead>
            <tr>
              <th>{language === 'km' ? 'សិស្ស' : 'Student'}</th>
              {formData.studentAssessment.subjects.map(subject => (
                <th key={subject.id}>
                  {language === 'km' ? subject.name_km : subject.name_en}
                  <br />
                  <small>({language === 'km' ? 'អតិបរមា' : 'Max'}: {subject.max_score})</small>
                </th>
              ))}
              <th>{language === 'km' ? 'សកម្មភាព' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {formData.studentAssessment.students.map((student, index) => {
              const studentScores = formData.studentAssessment.scores[student.id || ''] || {};

              return (
                <tr key={student.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      value={student.identifier || ''}
                      onChange={(e) => handleStudentChange(index, 'identifier', e.target.value)}
                      placeholder={`${language === 'km' ? 'សិស្សទី' : 'Student'}${index + 1} - ${language === 'km' ? 'បញ្ចូលឈ្មោះ' : 'Enter name'}`}
                      style={{ flex: 1, minWidth: '150px' }}
                      className={styles.tableInput}
                    />
                    <select
                      value={student.gender}
                      onChange={(e) => handleStudentChange(index, 'gender', e.target.value)}
                      className={styles.tableSelect}
                      style={{ width: '80px' }}
                    >
                      <option value="M">{language === 'km' ? 'ប្រុស' : 'Male'}</option>
                      <option value="F">{language === 'km' ? 'ស្រី' : 'Female'}</option>
                    </select>
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
                        className={styles.scoreInput}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      onClick={() => removeStudent(index)}
                      className={styles.deleteButton}
                      title={language === 'km' ? 'លុបសិស្ស' : 'Remove student'}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button 
          onClick={() => {
            const newStudents = Array.from({ length: 5 }, (_, i) => ({
              id: `${Date.now()}_${i}`,
              identifier: `${language === 'km' ? 'សិស្សទី' : 'Student'}${formData.studentAssessment.students.length + i + 1}`,
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
          className={styles.addButton}
          style={{ backgroundColor: '#1890ff', color: 'white' }}
        >
          + {language === 'km' ? 'បន្ថែមសិស្ស ៥ នាក់' : 'Add 5 Students'}
        </button>
        <button 
          onClick={addStudent}
          className={styles.addButton}
          style={{ backgroundColor: 'white', color: '#1890ff', border: '1px solid #1890ff' }}
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
        <AIAnalysis observationData={formData} language={language} />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>
          {language === 'km' 
            ? `ទម្រង់អង្កេត ${subjectNames[subject].km} - ${gradeNames[grade].km}`
            : `${subjectNames[subject].en} - ${gradeNames[grade].en} Observation Form`
          }
        </h1>
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

      {/* Form Content */}
      <div className={styles.formContent}>
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className={styles.navigationButtons}>
        {currentStep > 0 && (
          <button
            className={styles.prevButton}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            ← {language === 'km' ? 'ត្រឡប់' : 'Previous'}
          </button>
        )}
        {currentStep < steps.length - 1 ? (
          <button
            className={styles.nextButton}
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!isStepValid()}
          >
            {language === 'km' ? 'បន្ត' : 'Next'} →
          </button>
        ) : (
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving 
              ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
              : (language === 'km' ? '✓ រក្សាទុក' : '✓ Save Observation')
            }
          </button>
        )}
      </div>
    </div>
  );
}