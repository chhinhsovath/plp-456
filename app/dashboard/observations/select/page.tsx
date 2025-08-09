"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/translations";

export default function ObservationSelectPage() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const observationTypes = [
    {
      category: language === 'km' ? 'ភាសាខ្មែរ (ថ្នាក់ទី១-៣)' : 'Khmer Language (Grade 1-3)',
      color: "#4a90e2",
      items: [
        { 
          title: language === 'km' ? 'ភាសាខ្មែរ - ថ្នាក់ទី១' : 'Khmer - Grade 1',
          path: '/dashboard/observations/kh-grade-1',
          description: language === 'km' ? 'កម្រិត ១, ២, ៣' : 'Level 1, 2, 3'
        },
        { 
          title: language === 'km' ? 'ភាសាខ្មែរ - ថ្នាក់ទី២' : 'Khmer - Grade 2',
          path: '/dashboard/observations/kh-grade-2',
          description: language === 'km' ? 'កម្រិត ១, ២, ៣' : 'Level 1, 2, 3'
        },
        { 
          title: language === 'km' ? 'ភាសាខ្មែរ - ថ្នាក់ទី៣' : 'Khmer - Grade 3',
          path: '/dashboard/observations/kh-grade-3',
          description: language === 'km' ? 'កម្រិត ១, ២, ៣' : 'Level 1, 2, 3'
        }
      ]
    },
    {
      category: language === 'km' ? 'គណិតវិទ្យា (ថ្នាក់ទី១-៣)' : 'Mathematics (Grade 1-3)',
      color: "#50c878",
      items: [
        { 
          title: language === 'km' ? 'គណិតវិទ្យា - ថ្នាក់ទី១' : 'Mathematics - Grade 1',
          path: '/dashboard/observations/math-grade-1',
          description: language === 'km' ? 'កម្រិត ១, ២, ៣' : 'Level 1, 2, 3'
        },
        { 
          title: language === 'km' ? 'គណិតវិទ្យា - ថ្នាក់ទី២' : 'Mathematics - Grade 2',
          path: '/dashboard/observations/math-grade-2',
          description: language === 'km' ? 'កម្រិត ១, ២, ៣' : 'Level 1, 2, 3'
        },
        { 
          title: language === 'km' ? 'គណិតវិទ្យា - ថ្នាក់ទី៣' : 'Mathematics - Grade 3',
          path: '/dashboard/observations/math-grade-3',
          description: language === 'km' ? 'កម្រិត ១, ២, ៣' : 'Level 1, 2, 3'
        }
      ]
    },
    {
      category: language === 'km' ? 'ទម្រង់ទូទៅ' : 'General Forms',
      color: "#9b59b6",
      items: [
        { 
          title: language === 'km' ? 'ទម្រង់អង្កេតថ្នាក់ទី៤-៦' : 'Grade 4-6 Observation Form',
          path: '/dashboard/observations/new',
          description: language === 'km' ? 'ទម្រង់ស្តង់ដារសម្រាប់ថ្នាក់ទី៤-៦' : 'Standard form for Grade 4-6'
        },
        { 
          title: language === 'km' ? 'ទម្រង់ជ្រើសរើសតាមលក្ខខណ្ឌ' : 'Custom Criteria Form',
          path: '/dashboard/observations/master-fields-123',
          description: language === 'km' ? 'ជ្រើសរើសមុខវិជ្ជា ថ្នាក់ និងកម្រិត' : 'Select subject, grade and levels'
        }
      ]
    }
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "2px solid #e0e0e0"
      }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
          {language === 'km' ? 'ជ្រើសរើសទម្រង់អង្កេត' : 'Select Observation Form'}
        </h1>
        <p style={{ color: "#666", fontSize: "16px" }}>
          {language === 'km' 
            ? 'សូមជ្រើសរើសទម្រង់អង្កេតដែលសមស្របសម្រាប់ការវាយតម្លៃរបស់អ្នក'
            : 'Choose the appropriate observation form for your evaluation'
          }
        </p>
      </div>

      {/* Categories */}
      {observationTypes.map((category, idx) => (
        <div key={idx} style={{ marginBottom: "40px" }}>
          <h2 style={{ 
            fontSize: "20px", 
            fontWeight: "bold", 
            marginBottom: "20px",
            color: category.color,
            display: "flex",
            alignItems: "center"
          }}>
            <span style={{
              width: "4px",
              height: "24px",
              backgroundColor: category.color,
              marginRight: "12px",
              borderRadius: "2px"
            }}></span>
            {category.category}
          </h2>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {category.items.map((item, index) => (
              <div
                key={index}
                onClick={() => router.push(item.path)}
                style={{
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: "2px solid transparent",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = category.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: category.color
                }}></div>
                
                <h3 style={{ 
                  fontSize: "18px", 
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#333"
                }}>
                  {item.title}
                </h3>
                
                <p style={{ 
                  color: "#666", 
                  fontSize: "14px",
                  marginBottom: "15px"
                }}>
                  {item.description}
                </p>
                
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: category.color,
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  {language === 'km' ? 'ចូលទម្រង់' : 'Open Form'}
                  <span style={{ marginLeft: "5px" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Back Button */}
      <div style={{ 
        marginTop: "40px",
        paddingTop: "20px",
        borderTop: "1px solid #e0e0e0",
        textAlign: "center"
      }}>
        <button
          onClick={() => router.push("/dashboard/observations")}
          style={{
            padding: "12px 30px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          {language === 'km' ? 'ត្រឡប់ទៅទំព័រអង្កេត' : 'Back to Observations'}
        </button>
      </div>
    </div>
  );
}