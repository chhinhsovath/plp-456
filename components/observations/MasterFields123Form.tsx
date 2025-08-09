"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translations";

interface MasterField123 {
  id: number;
  order: number;
  subject: string;
  grade: string;
  level: string;
  field_type_one: string;
  field_type_two: string;
  field_type_three: string;
  field_type_four: string;
  activity: string;
  indicator: string;
  note: string;
}

interface MasterFields123FormProps {
  onFieldsChange?: (fields: MasterField123[]) => void;
  onEvaluationChange?: (evaluationData: { [key: string]: string }) => void;
}

export default function MasterFields123Form({ 
  onFieldsChange, 
  onEvaluationChange 
}: MasterFields123FormProps) {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<MasterField123[]>([]);
  const [filteredFields, setFilteredFields] = useState<MasterField123[]>([]);
  
  // Filter states
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  
  // Available options
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const levels = ["LEVEL-1", "LEVEL-2", "LEVEL-3"];
  
  // Evaluation data
  const [evaluationData, setEvaluationData] = useState<{ [key: string]: string }>({});

  // Load master fields from database
  useEffect(() => {
    fetchMasterFields();
  }, []);

  const fetchMasterFields = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/master-fields-123");
      if (response.ok) {
        const data = await response.json();
        setFields(data);
        
        // Extract unique subjects and grades
        const uniqueSubjects = [...new Set(data.map((f: MasterField123) => f.subject))];
        const uniqueGrades = [...new Set(data.flatMap((f: MasterField123) => 
          f.grade.split(',').map((g: string) => g.trim())
        ))];
        
        setSubjects(uniqueSubjects);
        setGrades(uniqueGrades);
      }
    } catch (error) {
      console.error("Error fetching master fields:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter fields based on selection
  useEffect(() => {
    let filtered = [...fields];
    
    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(f => f.subject === selectedSubject);
    }
    
    // Filter by grade
    if (selectedGrade) {
      filtered = filtered.filter(f => 
        f.grade.split(',').map(g => g.trim()).includes(selectedGrade)
      );
    }
    
    // Filter by selected levels
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(f => selectedLevels.includes(f.level));
    }
    
    // Sort by order
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    setFilteredFields(filtered);
    onFieldsChange?.(filtered);
  }, [selectedSubject, selectedGrade, selectedLevels, fields]);

  const handleLevelToggle = (level: string) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  const handleEvaluationChange = (fieldId: number, value: string) => {
    const newData = {
      ...evaluationData,
      [`field_${fieldId}`]: value
    };
    setEvaluationData(newData);
    onEvaluationChange?.(newData);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "LEVEL-1": return "#ff6b6b";
      case "LEVEL-2": return "#ffd93d";
      case "LEVEL-3": return "#6bcf7f";
      default: return "#e0e0e0";
    }
  };

  return (
    <div className="master-fields-123-form">
      {/* Filters Section */}
      <div className="filters-section" style={{ 
        padding: "20px", 
        backgroundColor: "#f5f5f5", 
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <h3>{language === 'km' ? 'ជ្រើសរើសលក្ខខណ្ឌ' : 'Select Criteria'}</h3>
        
        {/* Subject Selection */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            {language === 'km' ? 'មុខវិជ្ជា' : 'Subject'}:
          </label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px",
              border: "1px solid #ddd"
            }}
          >
            <option value="">
              {language === 'km' ? 'ជ្រើសរើសមុខវិជ្ជា' : 'Select Subject'}
            </option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* Grade Selection */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            {language === 'km' ? 'ថ្នាក់' : 'Grade'}:
          </label>
          <select 
            value={selectedGrade} 
            onChange={(e) => setSelectedGrade(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px",
              border: "1px solid #ddd"
            }}
          >
            <option value="">
              {language === 'km' ? 'ជ្រើសរើសថ្នាក់' : 'Select Grade'}
            </option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {/* Level Selection (Checkboxes) */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
            {language === 'km' ? 'កម្រិត' : 'Levels'}:
          </label>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {levels.map(level => (
              <label 
                key={level} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  cursor: "pointer",
                  padding: "8px 12px",
                  backgroundColor: selectedLevels.includes(level) ? getLevelColor(level) : "#fff",
                  color: selectedLevels.includes(level) ? "#fff" : "#333",
                  borderRadius: "20px",
                  border: `2px solid ${getLevelColor(level)}`,
                  transition: "all 0.3s ease"
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={() => handleLevelToggle(level)}
                  style={{ marginRight: "8px", display: "none" }}
                />
                <span style={{ fontWeight: selectedLevels.includes(level) ? "bold" : "normal" }}>
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e3f2fd", 
          borderRadius: "4px",
          marginTop: "15px"
        }}>
          <strong>{language === 'km' ? 'សង្ខេប' : 'Summary'}:</strong> {' '}
          {filteredFields.length} {language === 'km' ? 'សូចនាករ' : 'indicators'} 
          {selectedSubject && ` | ${selectedSubject}`}
          {selectedGrade && ` | ${selectedGrade}`}
          {selectedLevels.length > 0 && ` | ${selectedLevels.join(', ')}`}
        </div>
      </div>

      {/* Fields Display Section */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          {language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}
        </div>
      ) : (
        <div className="fields-display">
          {filteredFields.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px"
            }}>
              {language === 'km' 
                ? 'សូមជ្រើសរើសមុខវិជ្ជា ថ្នាក់ និងកម្រិត' 
                : 'Please select subject, grade and levels'}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {filteredFields.map((field, index) => (
                <div 
                  key={field.id} 
                  style={{ 
                    padding: "15px",
                    backgroundColor: "#fff",
                    borderLeft: `4px solid ${getLevelColor(field.level)}`,
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ 
                      backgroundColor: getLevelColor(field.level),
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {field.level}
                    </span>
                    <span style={{ color: "#666", fontSize: "14px" }}>
                      #{index + 1}
                    </span>
                  </div>
                  
                  {/* Display field information */}
                  {field.activity && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{language === 'km' ? 'សកម្មភាព' : 'Activity'}:</strong> {field.activity}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: "10px" }}>
                    <strong>{language === 'km' ? 'សូចនាករ' : 'Indicator'}:</strong> {field.indicator}
                  </div>

                  {/* Evaluation Radio Buttons */}
                  <div style={{ 
                    display: "flex", 
                    gap: "15px", 
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "4px"
                  }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`evaluation_${field.id}`}
                        value="yes"
                        checked={evaluationData[`field_${field.id}`] === "yes"}
                        onChange={() => handleEvaluationChange(field.id, "yes")}
                        style={{ marginRight: "5px" }}
                      />
                      <span>{language === 'km' ? 'បាទ/ចាស' : 'Yes'}</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`evaluation_${field.id}`}
                        value="no"
                        checked={evaluationData[`field_${field.id}`] === "no"}
                        onChange={() => handleEvaluationChange(field.id, "no")}
                        style={{ marginRight: "5px" }}
                      />
                      <span>{language === 'km' ? 'ទេ' : 'No'}</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`evaluation_${field.id}`}
                        value="na"
                        checked={evaluationData[`field_${field.id}`] === "na"}
                        onChange={() => handleEvaluationChange(field.id, "na")}
                        style={{ marginRight: "5px" }}
                      />
                      <span>{language === 'km' ? 'មិនពាក់ព័ន្ធ' : 'N/A'}</span>
                    </label>
                  </div>

                  {field.note && (
                    <div style={{ 
                      marginTop: "10px", 
                      padding: "8px",
                      backgroundColor: "#fff3cd",
                      borderRadius: "4px",
                      fontSize: "14px"
                    }}>
                      <strong>{language === 'km' ? 'ចំណាំ' : 'Note'}:</strong> {field.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}