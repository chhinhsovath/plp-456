"use client";

import { useState, useEffect } from 'react';
import styles from './AIAnalysis.module.css';

interface AIAnalysisProps {
  observationData: any;
  language?: 'km' | 'en';
}

interface AnalysisResult {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  detailedFeedback: string;
  performanceLevel: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
}

export default function AIAnalysis({ observationData, language = 'km' }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeObservation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          observationData,
          language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze observation');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing observation:', err);
      setError(language === 'km' ? 'មិនអាចវិភាគទិន្នន័យបាន' : 'Failed to analyze data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#faad14';
    return '#ff4d4f';
  };

  const getPerformanceLevelText = (level: string) => {
    const levels: { [key: string]: { km: string; en: string } } = {
      excellent: { km: 'ល្អប្រសើរ', en: 'Excellent' },
      good: { km: 'ល្អ', en: 'Good' },
      satisfactory: { km: 'មធ្យម', en: 'Satisfactory' },
      needs_improvement: { km: 'ត្រូវកែលម្អ', en: 'Needs Improvement' }
    };
    return levels[level]?.[language] || level;
  };

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.header}>
        <h3>{language === 'km' ? '🤖 វិភាគដោយ AI' : '🤖 AI Analysis'}</h3>
        <button
          onClick={analyzeObservation}
          disabled={loading}
          className={styles.analyzeButton}
        >
          {loading 
            ? (language === 'km' ? 'កំពុងវិភាគ...' : 'Analyzing...') 
            : (language === 'km' ? 'វិភាគ' : 'Analyze')}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {analysis && (
        <div className={styles.analysisContent}>
          {/* Overall Score */}
          <div className={styles.scoreSection}>
            <h4>{language === 'km' ? 'ពិន្ទុសរុប' : 'Overall Score'}</h4>
            <div className={styles.scoreCircle} style={{ borderColor: getScoreColor(analysis.overallScore) }}>
              <span className={styles.scoreNumber} style={{ color: getScoreColor(analysis.overallScore) }}>
                {analysis.overallScore}
              </span>
              <span className={styles.scoreMax}>/10</span>
            </div>
            <div className={styles.performanceLevel}>
              {getPerformanceLevelText(analysis.performanceLevel)}
            </div>
          </div>

          {/* Strengths */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              ✅ {language === 'km' ? 'ចំណុចខ្លាំង' : 'Teaching Strengths'}
            </h4>
            <ul className={styles.list}>
              {analysis.strengths.map((strength, idx) => (
                <li key={idx} className={styles.strengthItem}>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              ⚠️ {language === 'km' ? 'ចំណុចត្រូវកែលម្អ' : 'Areas for Improvement'}
            </h4>
            <ul className={styles.list}>
              {analysis.areasForImprovement.map((area, idx) => (
                <li key={idx} className={styles.improvementItem}>
                  {area}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              💡 {language === 'km' ? 'អនុសាសន៍' : 'Recommendations'}
            </h4>
            <ul className={styles.list}>
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className={styles.recommendationItem}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Feedback */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              📝 {language === 'km' ? 'មតិយោបល់លម្អិត' : 'Detailed Feedback'}
            </h4>
            <p className={styles.feedback}>
              {analysis.detailedFeedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}