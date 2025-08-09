"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";

interface ObservationFormProps {
  subject: "KH" | "MATH";
  grade: "1" | "2" | "3";
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

export default function Grade123ObservationForm({ subject, grade }: ObservationFormProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<MasterField[]>([]);
  
  // Level selection
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [levelSelectionConfirmed, setLevelSelectionConfirmed] = useState(false);
  
  // Basic observation info
  const [observationInfo, setObservationInfo] = useState({
    teacherName: "",
    school: "",
    schoolId: "",
    inspectionDate: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    totalMale: 0,
    totalFemale: 0,
    totalAbsent: 0,
    inspectorName: "",
    inspectorPosition: "",
    chapter: "",
    lesson: "",
    title: "",
  });
  
  // Evaluation data for each level
  const [level1Data, setLevel1Data] = useState<{ [key: string]: string }>({});
  const [level2Data, setLevel2Data] = useState<{ [key: string]: string }>({});
  const [level3Data, setLevel3Data] = useState<{ [key: string]: string }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  const subjectNames = {
    KH: { en: "Khmer Language", km: "ភាសាខ្មែរ" },
    MATH: { en: "Mathematics", km: "គណិតវិទ្យា" }
  };

  const gradeNames = {
    "1": { en: "Grade 1", km: "ថ្នាក់ទី១" },
    "2": { en: "Grade 2", km: "ថ្នាក់ទី២" },
    "3": { en: "Grade 3", km: "ថ្នាក់ទី៣" }
  };

  useEffect(() => {
    if (levelSelectionConfirmed && selectedLevels.length > 0) {
      fetchFields();
    }
  }, [levelSelectionConfirmed, selectedLevels, subject, grade]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/master-fields-123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          grade: `G${grade}`,
          levels: selectedLevels
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

  const handleLevelToggle = (level: string) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  const handleConfirmLevelSelection = () => {
    if (selectedLevels.length === 0) {
      alert(language === 'km' ? 'សូមជ្រើសរើសយ៉ាងហោចណាស់កម្រិតមួយ' : 'Please select at least one level');
      return;
    }
    setLevelSelectionConfirmed(true);
  };

  const handleChangeLevels = () => {
    setLevelSelectionConfirmed(false);
    setFields([]);
    setLevel1Data({});
    setLevel2Data({});
    setLevel3Data({});
    setComments({});
  };

  const handleInfoChange = (field: string, value: any) => {
    setObservationInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEvaluationChange = (fieldId: number, level: string, value: string) => {
    if (level === "LEVEL-1") {
      setLevel1Data(prev => ({ ...prev, [`field_${fieldId}`]: value }));
    } else if (level === "LEVEL-2") {
      setLevel2Data(prev => ({ ...prev, [`field_${fieldId}`]: value }));
    } else if (level === "LEVEL-3") {
      setLevel3Data(prev => ({ ...prev, [`field_${fieldId}`]: value }));
    }
  };

  const handleCommentChange = (fieldId: number, value: string) => {
    setComments(prev => ({ ...prev, [`field_${fieldId}`]: value }));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "LEVEL-1": return "#ff6b6b";
      case "LEVEL-2": return "#ffd93d";
      case "LEVEL-3": return "#6bcf7f";
      default: return "#e0e0e0";
    }
  };

  const getFieldsByLevel = (level: string) => {
    return fields.filter(f => f.level === level);
  };

  const calculateScore = (levelData: { [key: string]: string }) => {
    const total = Object.keys(levelData).length;
    const yes = Object.values(levelData).filter(v => v === "yes").length;
    return total > 0 ? Math.round((yes / total) * 100) : 0;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const observationData = {
        ...observationInfo,
        subject: subject,
        grade: parseInt(grade),
        evaluationData: {
          level1: level1Data,
          level2: level2Data,
          level3: level3Data
        },
        comments: comments,
        scores: {
          level1: calculateScore(level1Data),
          level2: calculateScore(level2Data),
          level3: calculateScore(level3Data)
        },
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(observationData)
      });
      
      if (response.ok) {
        alert(language === 'km' ? 'រក្សាទុកដោយជោគជ័យ!' : 'Saved successfully!');
        router.push("/dashboard/observations");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert(language === 'km' ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const renderLevelSection = (level: string, levelData: any, levelName: string) => {
    const levelFields = getFieldsByLevel(level);
    const score = calculateScore(levelData);
    
    // Only render if this level is selected
    if (!selectedLevels.includes(level)) {
      return null;
    }
    
    return (
      <div style={{ marginBottom: "30px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: "15px",
          padding: "10px",
          backgroundColor: getLevelColor(level),
          color: "white",
          borderRadius: "8px"
        }}>
          <h3 style={{ margin: 0, flex: 1 }}>{levelName}</h3>
          <div style={{ 
            backgroundColor: "rgba(255,255,255,0.3)", 
            padding: "5px 15px", 
            borderRadius: "20px",
            fontWeight: "bold"
          }}>
            {score}%
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {levelFields.map((field, index) => (
            <div 
              key={field.id}
              style={{ 
                padding: "15px",
                backgroundColor: "white",
                borderLeft: `4px solid ${getLevelColor(level)}`,
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                  #{index + 1}
                </span>
                {field.indicator}
              </div>
              
              <div style={{ 
                display: "flex", 
                gap: "15px",
                padding: "10px",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px"
              }}>
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={`eval_${field.id}`}
                    value="yes"
                    checked={levelData[`field_${field.id}`] === "yes"}
                    onChange={() => handleEvaluationChange(field.id, level, "yes")}
                  />
                  <span style={{ marginLeft: "5px" }}>
                    {language === 'km' ? 'បាទ/ចាស' : 'Yes'}
                  </span>
                </label>
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={`eval_${field.id}`}
                    value="no"
                    checked={levelData[`field_${field.id}`] === "no"}
                    onChange={() => handleEvaluationChange(field.id, level, "no")}
                  />
                  <span style={{ marginLeft: "5px" }}>
                    {language === 'km' ? 'ទេ' : 'No'}
                  </span>
                </label>
                <label style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={`eval_${field.id}`}
                    value="na"
                    checked={levelData[`field_${field.id}`] === "na"}
                    onChange={() => handleEvaluationChange(field.id, level, "na")}
                  />
                  <span style={{ marginLeft: "5px" }}>
                    {language === 'km' ? 'មិនពាក់ព័ន្ធ' : 'N/A'}
                  </span>
                </label>
              </div>
              
              <input
                type="text"
                placeholder={language === 'km' ? 'មតិយោបល់...' : 'Comments...'}
                value={comments[`field_${field.id}`] || ""}
                onChange={(e) => handleCommentChange(field.id, e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        paddingBottom: "15px",
        borderBottom: "2px solid #e0e0e0"
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 10px 0" }}>
            {language === 'km' 
              ? `ទម្រង់អង្កេត ${subjectNames[subject].km} - ${gradeNames[grade].km}`
              : `${subjectNames[subject].en} - ${gradeNames[grade].en} Observation Form`
            }
          </h1>
          <p style={{ color: "#666", margin: 0 }}>
            {language === 'km' ? 'វាយតម្លៃតាមកម្រិត ១, ២ និង ៣' : 'Evaluation by Level 1, 2, and 3'}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/observations/select")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {language === 'km' ? 'ត្រឡប់' : 'Back'}
        </button>
      </div>

      {/* Level Selection Section - Show first if not confirmed */}
      {!levelSelectionConfirmed && (
        <div style={{ 
          backgroundColor: "#f0f8ff",
          padding: "30px",
          borderRadius: "12px",
          marginBottom: "30px",
          border: "2px solid #4a90e2"
        }}>
          <h2 style={{ 
            marginBottom: "20px",
            color: "#2c3e50",
            textAlign: "center"
          }}>
            {language === 'km' ? 'ជ្រើសរើសកម្រិតដែលចង់វាយតម្លៃ' : 'Select Levels to Evaluate'}
          </h2>
          
          <p style={{ 
            textAlign: "center", 
            color: "#666",
            marginBottom: "30px"
          }}>
            {language === 'km' 
              ? 'សូមជ្រើសរើសកម្រិតមួយ ឬច្រើន ដែលអ្នកចង់វាយតម្លៃសម្រាប់ការអង្កេតនេះ'
              : 'Please select one or more levels you want to evaluate for this observation'
            }
          </p>

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
                  backgroundColor: selectedLevels.includes(level) ? getLevelColor(level) : "#fff",
                  color: selectedLevels.includes(level) ? "#fff" : "#333",
                  borderRadius: "12px",
                  border: `3px solid ${getLevelColor(level)}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  minWidth: "150px",
                  boxShadow: selectedLevels.includes(level) 
                    ? "0 4px 12px rgba(0,0,0,0.2)" 
                    : "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={() => handleLevelToggle(level)}
                  style={{ display: "none" }}
                />
                <div style={{ 
                  fontSize: "48px",
                  marginBottom: "10px"
                }}>
                  {index === 0 ? "1️⃣" : index === 1 ? "2️⃣" : "3️⃣"}
                </div>
                <span style={{ 
                  fontWeight: "bold",
                  fontSize: "18px"
                }}>
                  {language === 'km' ? `កម្រិតទី ${index + 1}` : `Level ${index + 1}`}
                </span>
                <span style={{ 
                  fontSize: "14px",
                  marginTop: "5px",
                  opacity: 0.9
                }}>
                  {selectedLevels.includes(level) 
                    ? (language === 'km' ? '✓ បានជ្រើសរើស' : '✓ Selected')
                    : (language === 'km' ? 'ចុចដើម្បីជ្រើសរើស' : 'Click to select')
                  }
                </span>
              </label>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleConfirmLevelSelection}
              disabled={selectedLevels.length === 0}
              style={{
                padding: "12px 40px",
                backgroundColor: selectedLevels.length === 0 ? "#ccc" : "#4a90e2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: selectedLevels.length === 0 ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
            >
              {language === 'km' ? 'បន្តទៅទម្រង់វាយតម្លៃ' : 'Continue to Evaluation Form'}
            </button>
          </div>
        </div>
      )}

      {/* Show change levels button if already confirmed */}
      {levelSelectionConfirmed && (
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
            {selectedLevels.map(level => level.replace('LEVEL-', 'Level ')).join(', ')}
          </div>
          <button
            onClick={handleChangeLevels}
            style={{
              padding: "8px 20px",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            {language === 'km' ? '🔄 ប្តូរកម្រិត' : '🔄 Change Levels'}
          </button>
        </div>
      )}

      {/* Basic Information Section - Only show after level selection */}
      {levelSelectionConfirmed && (
        <div style={{ 
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px"
        }}>
          <h2 style={{ marginBottom: "20px" }}>
            {language === 'km' ? 'ព័ត៌មានទូទៅ' : 'General Information'}
          </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {language === 'km' ? 'ឈ្មោះគ្រូ' : 'Teacher Name'}:
            </label>
            <input
              type="text"
              value={observationInfo.teacherName}
              onChange={(e) => handleInfoChange('teacherName', e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {language === 'km' ? 'សាលារៀន' : 'School'}:
            </label>
            <input
              type="text"
              value={observationInfo.school}
              onChange={(e) => handleInfoChange('school', e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}:
            </label>
            <input
              type="date"
              value={observationInfo.inspectionDate}
              onChange={(e) => handleInfoChange('inspectionDate', e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {language === 'km' ? 'ម៉ោងចាប់ផ្តើម - បញ្ចប់' : 'Start - End Time'}:
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="time"
                value={observationInfo.startTime}
                onChange={(e) => handleInfoChange('startTime', e.target.value)}
                style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <input
                type="time"
                value={observationInfo.endTime}
                onChange={(e) => handleInfoChange('endTime', e.target.value)}
                style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {language === 'km' ? 'ជំពូក' : 'Chapter'}:
            </label>
            <input
              type="text"
              value={observationInfo.chapter}
              onChange={(e) => handleInfoChange('chapter', e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              {language === 'km' ? 'មេរៀន' : 'Lesson'}:
            </label>
            <input
              type="text"
              value={observationInfo.lesson}
              onChange={(e) => handleInfoChange('lesson', e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
        </div>
        </div>
      )}

      {/* Evaluation Sections - Only show after level selection */}
      {levelSelectionConfirmed && (
        loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            {language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}
          </div>
        ) : (
          <>
            {renderLevelSection("LEVEL-1", level1Data, language === 'km' ? 'កម្រិតទី ១' : 'Level 1')}
            {renderLevelSection("LEVEL-2", level2Data, language === 'km' ? 'កម្រិតទី ២' : 'Level 2')}
            {renderLevelSection("LEVEL-3", level3Data, language === 'km' ? 'កម្រិតទី ៣' : 'Level 3')}
          </>
        )
      )}

      {/* Summary and Save - Only show after level selection */}
      {levelSelectionConfirmed && (
        <div style={{ 
          position: "sticky",
          bottom: 0,
          backgroundColor: "white",
          padding: "20px",
          borderTop: "2px solid #e0e0e0",
          marginTop: "30px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "30px" }}>
              {selectedLevels.includes("LEVEL-1") && (
                <div>
                  <span style={{ fontWeight: "bold", color: getLevelColor("LEVEL-1") }}>Level 1:</span> {calculateScore(level1Data)}%
                </div>
              )}
              {selectedLevels.includes("LEVEL-2") && (
                <div>
                  <span style={{ fontWeight: "bold", color: getLevelColor("LEVEL-2") }}>Level 2:</span> {calculateScore(level2Data)}%
                </div>
              )}
              {selectedLevels.includes("LEVEL-3") && (
                <div>
                  <span style={{ fontWeight: "bold", color: getLevelColor("LEVEL-3") }}>Level 3:</span> {calculateScore(level3Data)}%
                </div>
              )}
            </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 30px",
              backgroundColor: saving ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {saving 
              ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
              : (language === 'km' ? 'រក្សាទុក' : 'Save')
            }
          </button>
        </div>
      </div>
      )}
    </div>
  );
}