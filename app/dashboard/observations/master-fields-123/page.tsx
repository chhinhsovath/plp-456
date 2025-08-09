"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MasterFields123Form from "@/components/observations/MasterFields123Form";
import { useTranslation } from "@/lib/translations";
import { showToast } from "@/lib/toast";

export default function MasterFields123Page() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [selectedFields, setSelectedFields] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // This is a testing/preview tool for master fields
      const testData = {
        masterFields: selectedFields,
        evaluationData: evaluationData,
        statistics: {
          yes: Object.values(evaluationData).filter(v => v === "yes").length,
          no: Object.values(evaluationData).filter(v => v === "no").length,
          na: Object.values(evaluationData).filter(v => v === "na").length,
          total: Object.keys(evaluationData).length
        },
        timestamp: new Date().toISOString()
      };
      
      console.log("Master Fields Test Data:", testData);
      
      // For now, just show the test results
      const message = language === 'km' 
        ? `🧪 លទ្ធផលសាកល្បង - ✓ បាទ/ចាស: ${testData.statistics.yes} | ✗ ទេ: ${testData.statistics.no} | - មិនពាក់ព័ន្ធ: ${testData.statistics.na} | សរុប: ${testData.statistics.total} លក្ខណៈវិនិច្ឆ័យ`
        : `🧪 Test Results - ✓ Yes: ${testData.statistics.yes} | ✗ No: ${testData.statistics.no} | - N/A: ${testData.statistics.na} | Total: ${testData.statistics.total} criteria`;
      
      showToast(message, 'success');
      
      // Don't redirect - this is just a testing page
      // router.push("/dashboard/observations");
    } catch (error) {
      console.error("Error processing test data:", error);
      showToast(language === 'km' ? 'មានបញ្ហាក្នុងការដំណើរការទិន្នន័យ' : 'Error processing data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    // Export the evaluation data as JSON
    const exportData = {
      fields: selectedFields,
      evaluations: evaluationData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `observation_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "2px solid #e0e0e0"
      }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
          {language === 'km' ? 'ទម្រង់អង្កេតតាមកម្រិត' : 'Level-Based Observation Form'}
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {language === 'km' ? 'ត្រឡប់ក្រោយ' : 'Back'}
          </button>
          <button
            onClick={handleExport}
            disabled={Object.keys(evaluationData).length === 0}
            style={{
              padding: "10px 20px",
              backgroundColor: Object.keys(evaluationData).length === 0 ? "#ccc" : "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: Object.keys(evaluationData).length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {language === 'km' ? 'នាំចេញ' : 'Export'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(evaluationData).length === 0}
            style={{
              padding: "10px 20px",
              backgroundColor: saving || Object.keys(evaluationData).length === 0 ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving || Object.keys(evaluationData).length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {saving 
              ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
              : (language === 'km' ? 'រក្សាទុក' : 'Save')
            }
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: "#f0f8ff", 
        padding: "15px", 
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#0066cc" }}>
          <strong>{language === 'km' ? 'សេចក្តីណែនាំ:' : 'Instructions:'}</strong> {' '}
          {language === 'km' 
            ? 'ជ្រើសរើសមុខវិជ្ជា ថ្នាក់ និងកម្រិតដែលអ្នកចង់វាយតម្លៃ។ អ្នកអាចជ្រើសរើសកម្រិតច្រើនក្នុងពេលតែមួយ។'
            : 'Select the subject, grade, and levels you want to evaluate. You can select multiple levels at once.'
          }
        </p>
      </div>

      <MasterFields123Form 
        onFieldsChange={setSelectedFields}
        onEvaluationChange={setEvaluationData}
      />

      {/* Statistics */}
      {Object.keys(evaluationData).length > 0 && (
        <div style={{ 
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px"
        }}>
          <h3>{language === 'km' ? 'ស្ថិតិ' : 'Statistics'}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
            <div style={{ padding: "10px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                {Object.values(evaluationData).filter(v => v === "yes").length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {language === 'km' ? 'បាទ/ចាស' : 'Yes'}
              </div>
            </div>
            <div style={{ padding: "10px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>
                {Object.values(evaluationData).filter(v => v === "no").length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {language === 'km' ? 'ទេ' : 'No'}
              </div>
            </div>
            <div style={{ padding: "10px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#6c757d" }}>
                {Object.values(evaluationData).filter(v => v === "na").length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {language === 'km' ? 'មិនពាក់ព័ន្ធ' : 'N/A'}
              </div>
            </div>
            <div style={{ padding: "10px", backgroundColor: "white", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
                {Object.keys(evaluationData).length}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {language === 'km' ? 'សរុប' : 'Total'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}