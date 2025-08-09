"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";
import AIAnalysis from "@/components/ai/AIAnalysis";
import ProgressSteps from "@/components/ui/progress-steps";
import FormSection from "@/components/ui/form-section";
import AnimatedButton from "@/components/ui/animated-button";
import FadeIn from "@/components/ui/fade-in";
import styles from "./new-observation.module.css";
import { useToast, ToastContainer } from "@/components/Toast";

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

// Subject translations
const subjectTranslations: { [key: string]: { en: string; km: string } } = {
  mathematics: { en: "Mathematics", km: "គណិតវិទ្យា" },
  khmer: { en: "Khmer Language", km: "ភាសាខ្មែរ" },
  science: { en: "Science", km: "វិទ្យាសាស្ត្រ" },
  social: { en: "Social Studies", km: "សិក្សាសង្គម" },
  english: { en: "English", km: "ភាសាអង់គ្លេស" },
  pe: { en: "Physical Education", km: "អប់រំកាយ" },
};

export default function NewObservationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t, language } = useTranslation();
  const toast = useToast();
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
    subject: "",
    chapter: "",
    lesson: "",
    title: "",
    subTitle: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    grade: 1,
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

    // Evaluation data
    evaluationData: {},
    evaluationComments: {},

    // Student assessment
    studentAssessment: {
      subjects: [
        {
          id: "1",
          name_km: "អំណាន",
          name_en: "Reading",
          order: 1,
          max_score: 100,
        },
        {
          id: "2",
          name_km: "សរសេរ",
          name_en: "Writing",
          order: 2,
          max_score: 100,
        },
        {
          id: "3",
          name_km: "គណិតវិទ្យា",
          name_en: "Mathematics",
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

  const [evaluationIndicators, setEvaluationIndicators] = useState<any[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1]); // Default to level 1
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");

  // Helper functions for translations
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

  const getSubjectLabel = (key: string) => {
    return subjectTranslations[key]?.[language] || key;
  };

  // Dynamic data based on language
  const employmentTypes = [
    { value: "official", label: getEmploymentTypeLabel("official") },
    { value: "contract", label: getEmploymentTypeLabel("contract") },
    { value: "volunteer", label: getEmploymentTypeLabel("volunteer") },
  ];

  const sessionTimes = [
    { value: "morning", label: getSessionTimeLabel("morning") },
    { value: "afternoon", label: getSessionTimeLabel("afternoon") },
    { value: "full_day", label: getSessionTimeLabel("full_day") },
  ];

  const subjects = Object.keys(subjectTranslations).map((key) => ({
    value: key,
    label: getSubjectLabel(key),
  }));

  // Fetch indicators and provinces on mount
  useEffect(() => {
    fetchIndicators();
    fetchProvinces();
  }, []);

  const fetchIndicators = async () => {
    try {
      const response = await fetch("/api/observations/indicators");
      if (response.ok) {
        const data = await response.json();
        setEvaluationIndicators(data);
      }
    } catch (error) {
      console.error("Failed to fetch indicators:", error);
    }
  };

  // Filter indicators by selected levels
  const filteredIndicators = evaluationIndicators.filter((indicator) =>
    selectedLevels.includes(indicator.evaluationLevel),
  );

  const fetchProvinces = async () => {
    try {
      const response = await fetch("/api/geographic/provinces");
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces || []);
      }
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
    }
  };

  const fetchDistricts = async (provinceCode: string) => {
    try {
      const response = await fetch(
        `/api/geographic/districts?provinceCode=${provinceCode}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.districts || []);
        setCommunes([]); // Reset communes when province changes
      } else {
        console.error(
          "Failed to fetch districts:",
          response.status,
          await response.text(),
        );
        setDistricts([]);
      }
    } catch (error) {
      console.error("Failed to fetch districts:", error);
      setDistricts([]);
    }
  };

  const fetchCommunes = async (districtCode: string) => {
    try {
      const response = await fetch(
        `/api/geographic/communes?districtCode=${districtCode}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCommunes(data.communes || []);
        setVillages([]); // Reset villages when district changes
      } else {
        console.error(
          "Failed to fetch communes:",
          response.status,
          await response.text(),
        );
        setCommunes([]);
      }
    } catch (error) {
      console.error("Failed to fetch communes:", error);
      setCommunes([]);
    }
  };

  const fetchVillages = async (communeCode: string) => {
    try {
      const response = await fetch(
        `/api/geographic/villages?communeCode=${communeCode}`,
      );
      if (response.ok) {
        const data = await response.json();
        setVillages(data.villages || []);
      }
    } catch (error) {
      console.error("Failed to fetch villages:", error);
    }
  };

  const searchSchools = useCallback(async () => {
    if (!formData.provinceCode) {
      setSchools([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("provinceCode", formData.provinceCode);

      const response = await fetch(`/api/schools/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      } else {
        const errorText = await response.text();
        console.error("School search failed:", response.status, errorText);
        setSchools([]);
      }
    } catch (error) {
      console.error("Failed to search schools:", error);
      setSchools([]);
    }
  }, [formData.provinceCode]);

  // Trigger school search when province changes
  useEffect(() => {
    searchSchools();
  }, [searchSchools]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateEvaluationScore = (indicatorSequence: number, score: string) => {
    setFormData((prev) => ({
      ...prev,
      evaluationData: {
        ...prev.evaluationData,
        [`indicator_${indicatorSequence}`]: score,
      },
    }));
  };

  const updateEvaluationComment = (indicatorSequence: number, comment: string) => {
    setFormData((prev) => ({
      ...prev,
      evaluationComments: {
        ...prev.evaluationComments,
        [`indicator_${indicatorSequence}_comment`]: comment,
      },
    }));
  };

  const updateStudentScore = (
    subjectOrder: number,
    studentOrder: number,
    score: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      studentAssessment: {
        ...prev.studentAssessment,
        scores: {
          ...prev.studentAssessment.scores,
          [`subject_${subjectOrder}`]: {
            ...prev.studentAssessment.scores[`subject_${subjectOrder}`],
            [`student_${studentOrder}`]: score,
          },
        },
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate required fields before submission
      const requiredFields = {
        province: formData.province,
        district: formData.district,
        school: formData.school,
        nameOfTeacher: formData.nameOfTeacher,
        subject: formData.subject,
        grade: formData.grade,
        inspectionDate: formData.inspectionDate
      };
      
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value || value === '')
        .map(([key, _]) => key);
        
      if (missingFields.length > 0) {
        toast.warning(
          language === 'km' ? 'បំពេញព័ត៌មាន!' : 'Missing Fields!',
          language === 'km' 
            ? `សូមបំពេញចំណុចចាំបាច់: ${missingFields.join(', ')}`
            : `Please fill in required fields: ${missingFields.join(', ')}`,
          5000
        );
        setLoading(false);
        return;
      }
      
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
          ...formData.evaluationComments,
        },
        evaluationData: {
          ...formData.evaluationData,
          evaluationLevels: selectedLevels,
          ...formData.evaluationComments,
        },
        studentAssessment: formData.studentAssessment,
      };

      console.log('Submitting observation data:', JSON.stringify(payload, null, 2));

      const response = await fetch("/api/observations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Observation created successfully:', result.id);
        toast.success(
          language === 'km' ? 'ជោគជ័យ!' : 'Success!',
          language === 'km' ? 'ការអង្កេតត្រូវបានបង្កើតដោយជោគជ័យ!' : 'Observation created successfully!',
          3000
        );
        setTimeout(() => {
          router.push("/dashboard/observations");
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to create observation");
      }
    } catch (error) {
      console.error("Error creating observation:", error);
      
      let errorMessage = "Failed to create observation. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(
        language === 'km' ? 'កំហុស!' : 'Error!',
        errorMessage,
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    t("forms.basicInfo"),
    t("forms.teachingEvaluation"),
    t("forms.studentAssessment"),
    `${t("common.view")} & ${t("common.submit")}`,
  ];

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.province &&
          formData.district &&
          formData.school &&
          formData.nameOfTeacher?.trim() &&
          formData.subject &&
          formData.grade > 0 &&
          formData.inspectionDate
        );
      case 1:
        return (
          selectedLevels.length > 0 &&
          filteredIndicators.length > 0 &&
          Object.keys(formData.evaluationData).length >= filteredIndicators.length
        );
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

  return (
    <ToastContainer>
      <div className={styles.container}>
        <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>{t("observations.newObservation")}</h1>
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
              ← {language === 'km' ? 'ត្រឡប់ទៅជម្រើស' : 'Back to Selection'}
            </button>
            <button
              onClick={() => router.push('/dashboard/observations')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
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
                e.currentTarget.style.backgroundColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
              }}
            >
              📋 {language === 'km' ? 'បញ្ជីអង្កេត' : 'Observations List'}
            </button>
          </div>
        </div>
      </div>

      <FadeIn delay={0.1}>
        <ProgressSteps steps={steps} currentStep={currentStep} />
      </FadeIn>

      <div className={styles.formContainer}>
        {currentStep === 0 && (
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
                      const selectedProvince = provinces.find(
                        (p) => p.province_code.toString() === e.target.value,
                      );
                      updateFormData({
                        province: selectedProvince?.province_name_en || "",
                        provinceCode: e.target.value,
                        provinceNameKh:
                          selectedProvince?.province_name_kh || "",
                        district: "",
                        districtCode: "",
                        districtNameKh: "",
                        commune: "",
                        communeCode: "",
                        communeNameKh: "",
                        village: "",
                        villageCode: "",
                        villageNameKh: "",
                      });
                      if (selectedProvince) {
                        fetchDistricts(
                          selectedProvince.province_code.toString(),
                        );
                        setSchools([]); // Reset schools when province changes
                      }
                    }}
                  >
                    <option value="">ជ្រើសរើសខេត្ត/ក្រុង</option>
                    {provinces.map((p) => (
                      <option
                        key={p.province_code}
                        value={p.province_code.toString()}
                      >
                        {p.province_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.district")}*</label>
                  <select
                    value={formData.districtCode}
                    onChange={(e) => {
                      const selectedDistrict = districts.find(
                        (d) => d.district_code.toString() === e.target.value,
                      );
                      updateFormData({
                        district: selectedDistrict?.district_name_en || "",
                        districtCode: e.target.value,
                        districtNameKh:
                          selectedDistrict?.district_name_kh || "",
                        commune: "",
                        communeCode: "",
                        communeNameKh: "",
                        village: "",
                        villageCode: "",
                        villageNameKh: "",
                      });
                      if (selectedDistrict) {
                        fetchCommunes(
                          selectedDistrict.district_code.toString(),
                        );
                      }
                    }}
                    disabled={!formData.provinceCode}
                  >
                    <option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
                    {districts.map((d) => (
                      <option
                        key={d.district_code}
                        value={d.district_code.toString()}
                      >
                        {d.district_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.commune")}</label>
                  <select
                    value={formData.communeCode}
                    onChange={(e) => {
                      const selectedCommune = communes.find(
                        (c) => c.commune_code.toString() === e.target.value,
                      );
                      updateFormData({
                        commune: selectedCommune?.commune_name_en || "",
                        communeCode: e.target.value,
                        communeNameKh: selectedCommune?.commune_name_kh || "",
                        village: "",
                        villageCode: "",
                        villageNameKh: "",
                      });
                      if (selectedCommune) {
                        fetchVillages(selectedCommune.commune_code.toString());
                      }
                    }}
                    disabled={!formData.districtCode}
                  >
                    <option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
                    {communes.map((c) => (
                      <option
                        key={c.commune_code}
                        value={c.commune_code.toString()}
                      >
                        {c.commune_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.village")}</label>
                  <select
                    value={formData.villageCode}
                    onChange={(e) => {
                      const selectedVillage = villages.find(
                        (v) => v.village_code === e.target.value,
                      );
                      updateFormData({
                        village: selectedVillage?.village_name_en || "",
                        villageCode: e.target.value,
                        villageNameKh: selectedVillage?.village_name_kh || "",
                      });
                    }}
                    disabled={!formData.communeCode}
                  >
                    <option value="">ជ្រើសរើសភូមិ</option>
                    {villages.map((v) => (
                      <option key={v.village_code} value={v.village_code}>
                        {v.village_name_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.cluster")}</label>
                  <input
                    type="text"
                    value={formData.cluster}
                    onChange={(e) =>
                      updateFormData({ cluster: e.target.value })
                    }
                    placeholder={language === 'km' ? 'បញ្ចូលបណ្តុំសាលា' : 'Enter cluster'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.school")}*</label>
                  <select
                    value={formData.schoolId || ''}
                    onChange={(e) => {
                      const selectedSchool = schools.find(
                        (s) => s.id === parseInt(e.target.value),
                      );
                      updateFormData({
                        school: selectedSchool?.name || '',
                        schoolId: selectedSchool?.id || 0,
                      });
                    }}
                    disabled={!formData.provinceCode}
                  >
                    <option value="">ជ្រើសរើសសាលារៀន</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
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
                    onChange={(e) =>
                      updateFormData({ nameOfTeacher: e.target.value })
                    }
                    placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះគ្រូ' : 'Enter teacher name'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === "km" ? "ភេទ" : "Gender"}*</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => updateFormData({ sex: e.target.value })}
                  >
                    <option value="M">{language === 'km' ? 'ប្រុស' : 'Male'}</option>
                    <option value="F">{language === 'km' ? 'ស្រី' : 'Female'}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("teachers.employmentType")}*</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) =>
                      updateFormData({ employmentType: e.target.value })
                    }
                  >
                    {employmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
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
                  <label>{t("observations.subject")}*</label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      updateFormData({ subject: e.target.value })
                    }
                  >
                    <option value="">{language === 'km' ? 'ជ្រើសរើសមុខវិជ្ជា' : 'Select Subject'}</option>
                    {subjects.map((s) => (
                      <option key={s.value} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("observations.grade")}*</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.grade}
                    onChange={(e) =>
                      updateFormData({ grade: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("observations.chapter")}</label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={(e) =>
                      updateFormData({ chapter: e.target.value })
                    }
                    placeholder={language === 'km' ? 'លេខជំពូក' : 'Chapter number'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("observations.lesson")}</label>
                  <input
                    type="text"
                    value={formData.lesson}
                    onChange={(e) => updateFormData({ lesson: e.target.value })}
                    placeholder={language === 'km' ? 'លេខមេរៀន' : 'Lesson number'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    {language === "km" ? "ចំណងជើងមេរៀន" : "Lesson Title"}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder={language === 'km' ? 'ចំណងជើងមេរៀន' : 'Lesson title'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === "km" ? "ចំណងជើងរង" : "Subtitle"}</label>
                  <input
                    type="text"
                    value={formData.subTitle}
                    onChange={(e) =>
                      updateFormData({ subTitle: e.target.value })
                    }
                    placeholder={language === 'km' ? 'ចំណងជើងរង' : 'Lesson subtitle'}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>{t("observations.sessionTime")}*</label>
                  <select
                    value={formData.sessionTime}
                    onChange={(e) =>
                      updateFormData({ sessionTime: e.target.value })
                    }
                  >
                    {sessionTimes.map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t("common.date")}*</label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) =>
                      updateFormData({ inspectionDate: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("observations.startTime")}</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      updateFormData({ startTime: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("observations.endTime")}</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      updateFormData({ endTime: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.academicYear")}</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) =>
                      updateFormData({ academicYear: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{t("forms.semester")}</label>
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      updateFormData({ semester: parseInt(e.target.value) })
                    }
                  >
                    <option value={1}>{language === 'km' ? 'ឆមាសទី ១' : 'Semester 1'}</option>
                    <option value={2}>{language === 'km' ? 'ឆមាសទី ២' : 'Semester 2'}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>
                    {t("observations.duration")} (
                    {language === "km" ? "នាទី" : "minutes"})
                  </label>
                  <input
                    type="number"
                    value={formData.lessonDurationMinutes}
                    onChange={(e) =>
                      updateFormData({
                        lessonDurationMinutes: parseInt(e.target.value) || 45,
                      })
                    }
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
                    min="0"
                    value={formData.totalMale}
                    onChange={(e) =>
                      updateFormData({
                        totalMale: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'សិស្សស្រីសរុប' : 'Total Female Students'}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalFemale}
                    onChange={(e) =>
                      updateFormData({
                        totalFemale: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'សិស្សសរុប' : 'Total Students'}</label>
                  <input
                    type="number"
                    value={calculateTotalStudents()}
                    disabled
                    className={styles.readOnlyInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'អវត្តមានសរុប' : 'Total Absent'}</label>
                  <input
                    type="number"
                    min="0"
                    max={calculateTotalStudents()}
                    value={formData.totalAbsent}
                    onChange={(e) =>
                      updateFormData({
                        totalAbsent: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'អវត្តមានស្រី' : 'Absent Female'}</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalFemale}
                    value={formData.totalAbsentFemale}
                    onChange={(e) =>
                      updateFormData({
                        totalAbsentFemale: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'សិស្សមករៀន' : 'Present Students'}</label>
                  <input
                    type="number"
                    value={calculatePresentStudents()}
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
                    onChange={(e) =>
                      updateFormData({ inspectorName: e.target.value })
                    }
                    placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះអ្នកត្រួតពិនិត្យ' : 'Enter inspector name'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'តួនាទី' : 'Position'}</label>
                  <input
                    type="text"
                    value={formData.inspectorPosition}
                    onChange={(e) =>
                      updateFormData({ inspectorPosition: e.target.value })
                    }
                    placeholder={language === 'km' ? 'បញ្ចូលតួនាទី' : 'Enter position'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>{language === 'km' ? 'ស្ថាប័ន' : 'Organization'}</label>
                  <input
                    type="text"
                    value={formData.inspectorOrganization}
                    onChange={(e) =>
                      updateFormData({ inspectorOrganization: e.target.value })
                    }
                    placeholder={language === 'km' ? 'បញ្ចូលស្ថាប័ន' : 'Enter organization'}
                  />
                </div>
                </div>
              </FormSection>
            </div>
          </FadeIn>
        )}

        {currentStep === 1 && (
          <div className={styles.section}>
            <h2>{t('forms.teachingEvaluation')}</h2>

            <div className={styles.levelSelection}>
              <p className={styles.sectionDescription}>
                {language === 'km' ? 'ជ្រើសរើសកម្រិតវាយតម្លៃ:' : 'Select evaluation level(s):'}
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
                        setSelectedLevels(
                          selectedLevels.filter((l) => l !== 1),
                        );
                      }
                    }}
                  />
                  <span
                    className={styles.levelTag}
                    style={{ backgroundColor: "#52c41a" }}
                  >
                    {language === 'km' ? 'កម្រិត ១ - មូលដ្ឋាន' : 'Level 1 - Basic'}
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
                        setSelectedLevels(
                          selectedLevels.filter((l) => l !== 2),
                        );
                      }
                    }}
                  />
                  <span
                    className={styles.levelTag}
                    style={{ backgroundColor: "#1890ff" }}
                  >
                    {language === 'km' ? 'កម្រិត ២ - មធ្យម' : 'Level 2 - Intermediate'}
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
                        setSelectedLevels(
                          selectedLevels.filter((l) => l !== 3),
                        );
                      }
                    }}
                  />
                  <span
                    className={styles.levelTag}
                    style={{ backgroundColor: "#fa8c16" }}
                  >
                    {language === 'km' ? 'កម្រិត ៣ - ខ្ពស់' : 'Level 3 - Advanced'}
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.evaluationGrid}>
              {filteredIndicators.map((indicator) => (
                <div key={indicator.indicatorSequence} className={styles.evaluationItem}>
                  <div className={styles.evaluationHeader}>
                    <span
                      className={styles.levelBadge}
                      style={{
                        backgroundColor:
                          indicator.evaluationLevel === 1
                            ? "#52c41a"
                            : indicator.evaluationLevel === 2
                              ? "#1890ff"
                              : "#fa8c16",
                      }}
                    >
                      {language === 'km' ? `កម្រិត ${indicator.evaluationLevel}` : `Level ${indicator.evaluationLevel}`}
                    </span>
                    <h3>
                      {indicator.indicatorMain || indicator.indicatorMainEn}
                    </h3>
                    <p>{indicator.indicatorSub || indicator.indicatorSubEn}</p>
                  </div>

                  <div className={styles.ratingOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name={`indicator_${indicator.indicatorSequence}`}
                        value="yes"
                        checked={
                          formData.evaluationData[
                            `indicator_${indicator.indicatorSequence}`
                          ] === "yes"
                        }
                        onChange={() =>
                          updateEvaluationScore(indicator.indicatorSequence, "yes")
                        }
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
                        name={`indicator_${indicator.indicatorSequence}`}
                        value="some_practice"
                        checked={
                          formData.evaluationData[
                            `indicator_${indicator.indicatorSequence}`
                          ] === "some_practice"
                        }
                        onChange={() =>
                          updateEvaluationScore(
                            indicator.indicatorSequence,
                            "some_practice",
                          )
                        }
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
                        name={`indicator_${indicator.indicatorSequence}`}
                        value="no"
                        checked={
                          formData.evaluationData[
                            `indicator_${indicator.indicatorSequence}`
                          ] === "no"
                        }
                        onChange={() =>
                          updateEvaluationScore(indicator.indicatorSequence, "no")
                        }
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
                      value={
                        formData.evaluationComments[
                          `indicator_${indicator.indicatorSequence}_comment`
                        ] || ""
                      }
                      onChange={(e) =>
                        updateEvaluationComment(
                          indicator.indicatorSequence,
                          e.target.value,
                        )
                      }
                      placeholder={
                        indicator.aiContext ||
                        (language === 'km' ? 'បន្ថែមការសង្កេត ឬមតិយោបល់ជាក់លាក់...' : 'Add any specific observations or feedback...')
                      }
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>

            {filteredIndicators.length === 0 && (
              <div className={styles.noIndicators}>
                <p>
                  {language === 'km' ? 'សូមជ្រើសរើសកម្រិតវាយតម្លៃយ៉ាងហោចណាស់មួយដើម្បីមើលសូចនាករ។' : 'Please select at least one evaluation level to see indicators.'}
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.section}>
            <h2>{t('forms.studentAssessment')}</h2>
            <p className={styles.sectionDescription}>
              {language === 'km' ? 'វាយតម្លៃគំរូសិស្សតាមមុខវិជ្ជាផ្សេងៗ (ស្រេចចិត្ត)' : 'Evaluate a sample of students across different subjects (optional)'}
            </p>

            <div className={styles.assessmentTable}>
              <table>
                <thead>
                  <tr>
                    <th>{language === 'km' ? 'សិស្ស' : 'Student'}</th>
                    {formData.studentAssessment.subjects.map((subject) => (
                      <th key={subject.order}>
                        {language === "km" ? subject.name_km : subject.name_en}
                        <br />
                        <small>({language === 'km' ? 'អតិបរមា' : 'Max'}: {subject.max_score})</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.studentAssessment.students.map((student) => (
                    <tr key={student.order}>
                      <td>
                        {student.identifier} - {student.name}
                        <small> ({student.gender})</small>
                      </td>
                      {formData.studentAssessment.subjects.map((subject) => (
                        <td key={`${student.order}-${subject.order}`}>
                          <input
                            type="number"
                            min="0"
                            max={subject.max_score}
                            step="0.5"
                            value={
                              formData.studentAssessment.scores[
                                `subject_${subject.order}`
                              ]?.[`student_${student.order}`] || ""
                            }
                            onChange={(e) =>
                              updateStudentScore(
                                subject.order,
                                student.order,
                                parseFloat(e.target.value) || 0,
                              )
                            }
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
            <h2>{language === 'km' ? 'ពិនិត្យ និងដាក់ស្នើ' : 'Review & Submit'}</h2>

            <div className={styles.reviewSection}>
              <h3>{language === 'km' ? 'សង្ខេបវគ្គ' : 'Session Summary'}</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <label>{language === 'km' ? 'សាលារៀន:' : 'School:'}</label>
                  <span>{formData.school}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{language === 'km' ? 'គ្រូបង្រៀន:' : 'Teacher:'}</label>
                  <span>{formData.nameOfTeacher}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{language === 'km' ? 'មុខវិជ្ជា:' : 'Subject:'}</label>
                  <span>
                    {formData.subject} - Grade {formData.grade}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{language === 'km' ? 'កាលបរិច្ឆេទ:' : 'Date:'}</label>
                  <span>
                    {new Date(formData.inspectionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <label>{language === 'km' ? 'សិស្ស:' : 'Students:'}</label>
                  <span>
                    {calculatePresentStudents()} {language === 'km' ? 'មករៀន' : 'present'} /{" "}
                    {calculateTotalStudents()} {language === 'km' ? 'សរុប' : 'total'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.reviewSection}>
              <h3>{language === 'km' ? 'សង្ខេបការវាយតម្លៃ' : 'Evaluation Summary'}</h3>
              <div className={styles.evaluationSummary}>
                {Object.entries(formData.evaluationData).length > 0 ? (
                  <div className={styles.summaryList}>
                    {filteredIndicators.map((indicator) => {
                      const score =
                        formData.evaluationData[
                          `indicator_${indicator.indicatorSequence}`
                        ];
                      return score ? (
                        <div
                          key={indicator.indicatorSequence}
                          className={styles.summaryEvalItem}
                        >
                          <span>
                            {indicator.indicatorMain ||
                              indicator.indicatorMainEn}
                            :
                          </span>
                          <strong
                            style={{
                              color:
                                score === "yes"
                                  ? "#52c41a"
                                  : score === "some_practice"
                                    ? "#faad14"
                                    : "#ff4d4f",
                            }}
                          >
                            {score === "yes"
                              ? (language === 'km' ? 'បាទ/ចាស' : 'Yes')
                              : score === "some_practice"
                                ? (language === 'km' ? 'អនុវត្តខ្លះ' : 'Some Practice')
                                : (language === 'km' ? 'ទេ' : 'No')}
                          </strong>
                        </div>
                      ) : null;
                    })}
                    <div className={styles.summaryTotal}>
                      <span>{language === 'km' ? 'កម្រិតវាយតម្លៃ:' : 'Evaluation Levels:'}</span>
                      <strong>
                        {selectedLevels
                          .map((level) => language === 'km' ? `កម្រិត ${level}` : `Level ${level}`)
                          .join(", ")}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p>{language === 'km' ? 'មិនមានទិន្នន័យវាយតម្លៃ' : 'No evaluation data entered'}</p>
                )}
              </div>
            </div>

            <div className={styles.reviewSection}>
              <h3>{language === 'km' ? 'កំណត់ចំណាំទូទៅ' : 'General Notes'}</h3>
              <textarea
                value={formData.generalNotes}
                onChange={(e) =>
                  updateFormData({ generalNotes: e.target.value })
                }
                placeholder={language === 'km' ? 'បន្ថែមការសង្កេត ឬអនុសាសន៍បន្ថែម...' : 'Add any additional observations or recommendations...'}
                rows={4}
                className={styles.fullWidthTextarea}
              />
            </div>

            <div className={styles.reviewSection}>
              <AIAnalysis observationData={formData} language={language} />
            </div>
          </div>
        )}
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
          {currentStep < steps.length - 1 ? (
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
              loading={loading}
            >
              {language === 'km' ? 'ដាក់ស្នើការសង្កេត' : 'Submit Observation'}
            </AnimatedButton>
          )}
        </div>
      </FadeIn>
      </div>
    </ToastContainer>
  );
}
