"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './AIAnalysis.module.css';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AIAnalysis Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className={styles.error}>
          Something went wrong with the analysis. Please try again.
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

interface ObservationData {
  id?: string;
  nameOfTeacher?: string;
  subject?: string;
  school?: string;
  grade?: string | number;
  evaluationData?: Record<string, string>;
  masterFields?: Array<{
    id: number;
    indicator?: string;
    level?: string;
  }>;
  aiAnalysis?: {
    overallScore?: number;
    performanceLevel?: string;
    strengths?: any;
    areasForImprovement?: any;
    recommendations?: any;
    detailedFeedback?: string;
    language?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  [key: string]: any;
}

interface AIAnalysisProps {
  observationData: ObservationData;
  language?: 'km' | 'en';
  onAnalysisComplete?: (result: AnalysisResult) => void;
  disabled?: boolean;
}

interface AnalysisResult {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  detailedFeedback: string;
  performanceLevel: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
}

interface APIError {
  error: string;
  status?: number;
}

function AIAnalysisComponent({ 
  observationData, 
  language = 'km', 
  onAnalysisComplete,
  disabled = false 
}: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasCachedAnalysis, setHasCachedAnalysis] = useState(false);
  
  // Memoize data validation
  const isValidData = useMemo(() => {
    if (!observationData || typeof observationData !== 'object') return false;
    const requiredFields = ['nameOfTeacher', 'subject', 'school'];
    return requiredFields.every(field => 
      observationData[field] && 
      typeof observationData[field] === 'string' && 
      observationData[field].trim().length > 0
    );
  }, [observationData]);

  const analyzeObservation = useCallback(async () => {
    if (!isValidData) {
      setError(language === 'km' 
        ? 'ទិន្នន័យមិនត្រឹមត្រូវ សូមពិនិត្យឡើងវិញ' 
        : 'Invalid data. Please check required fields.');
      return;
    }

    if (disabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          observationData,
          language
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Failed to analyze observation';
        try {
          const errorData: APIError = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Use default message if JSON parsing fails
        }
        
        if (response.status === 429) {
          setError(language === 'km' 
            ? 'សំណើរច្រើនពេក សូមចាំបន្តិច' 
            : 'Too many requests. Please wait a moment.');
          return;
        }
        
        if (response.status === 503) {
          setError(language === 'km' 
            ? 'សេវាកម្មមិនអាចប្រើបានបណ្តោះអាសន្ន' 
            : 'Service temporarily unavailable.');
          return;
        }
        
        throw new Error(errorMessage);
      }

      const result: AnalysisResult = await response.json();
      
      // Validate result structure
      if (!result || typeof result.overallScore !== 'number' || !Array.isArray(result.strengths)) {
        throw new Error('Invalid response format');
      }
      
      setAnalysis(result);
      setRetryCount(0); // Reset retry count on success
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('Error analyzing observation:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        setError(language === 'km' 
          ? 'ការវិភាគលើសពេលកំណត់' 
          : 'Analysis timed out. Please try again.');
      } else {
        const shouldRetry = retryCount < 2;
        setError(language === 'km' 
          ? `មិនអាចវិភាគទិន្នន័យបាន${shouldRetry ? ' (កំពុងព្យាយាមម្តងទៀត...)' : ''}` 
          : `Failed to analyze data${shouldRetry ? ' (retrying...)' : ''}`);
        
        // Auto-retry up to 2 times with exponential backoff
        if (shouldRetry) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            analyzeObservation();
          }, Math.pow(2, retryCount) * 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [observationData, language, isValidData, disabled, retryCount, onAnalysisComplete]);

  // Memoize expensive calculations
  const getScoreColor = useCallback((score: number) => {
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#faad14';
    return '#ff4d4f';
  }, []);

  const getPerformanceLevelText = useCallback((level: string) => {
    const levels: { [key: string]: { km: string; en: string } } = {
      excellent: { km: 'ល្អប្រសើរ', en: 'Excellent' },
      good: { km: 'ល្អ', en: 'Good' },
      satisfactory: { km: 'មធ្យម', en: 'Satisfactory' },
      needs_improvement: { km: 'ត្រូវកែលម្អ', en: 'Needs Improvement' }
    };
    return levels[level]?.[language] || level;
  }, [language]);
  
  // Auto-clear error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check for cached AI analysis on mount
  useEffect(() => {
    if (observationData?.aiAnalysis) {
      const cachedAnalysis = observationData.aiAnalysis;
      
      // Transform cached data to match AnalysisResult interface
      const analysisResult: AnalysisResult = {
        overallScore: cachedAnalysis.overallScore || 0,
        performanceLevel: (cachedAnalysis.performanceLevel || 'satisfactory') as any,
        strengths: Array.isArray(cachedAnalysis.strengths) 
          ? cachedAnalysis.strengths 
          : (cachedAnalysis.strengths ? [cachedAnalysis.strengths] : []),
        areasForImprovement: Array.isArray(cachedAnalysis.areasForImprovement)
          ? cachedAnalysis.areasForImprovement
          : (cachedAnalysis.areasForImprovement ? [cachedAnalysis.areasForImprovement] : []),
        recommendations: Array.isArray(cachedAnalysis.recommendations)
          ? cachedAnalysis.recommendations
          : (cachedAnalysis.recommendations ? [cachedAnalysis.recommendations] : []),
        detailedFeedback: cachedAnalysis.detailedFeedback || ''
      };
      
      setAnalysis(analysisResult);
      setHasCachedAnalysis(true);
      
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
    }
  }, [observationData?.aiAnalysis, onAnalysisComplete]);

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.header}>
        <h3>
          {language === 'km' ? '🤖 វិភាគដោយ AI' : '🤖 AI Analysis'}
          {hasCachedAnalysis && (
            <span className={styles.cachedBadge} title={language === 'km' ? 'វិភាគបានរក្សាទុក' : 'Cached Analysis'}>
              {language === 'km' ? '(បានរក្សាទុក)' : '(Cached)'}
            </span>
          )}
        </h3>
        <button
          onClick={analyzeObservation}
          disabled={loading || disabled || !isValidData}
          className={`${styles.analyzeButton} ${(!isValidData || disabled) ? styles.disabled : ''}`}
          title={!isValidData ? (language === 'km' ? 'ទិន្នន័យមិនគ្រប់គ្រាន់' : 'Insufficient data') : ''}
        >
          {loading 
            ? (language === 'km' ? 'កំពុងវិភាគ...' : 'Analyzing...') 
            : hasCachedAnalysis
              ? (language === 'km' ? 'វិភាគឡើងវិញ' : 'Re-analyze')
              : (language === 'km' ? 'វិភាគ' : 'Analyze')}
        </button>
      </div>

      {error && (
        <div className={`${styles.error} ${styles.fadeIn}`}>
          <div className={styles.errorContent}>
            {error}
            <button 
              className={styles.dismissButton}
              onClick={() => setError(null)}
              title={language === 'km' ? 'បិទ' : 'Dismiss'}
            >
              ×
            </button>
          </div>
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
              {analysis.strengths.slice(0, 5).map((strength, idx) => (
                <li key={`strength-${idx}`} className={styles.strengthItem}>
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
              {analysis.areasForImprovement.slice(0, 4).map((area, idx) => (
                <li key={`improvement-${idx}`} className={styles.improvementItem}>
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
              {analysis.recommendations.slice(0, 5).map((rec, idx) => (
                <li key={`recommendation-${idx}`} className={styles.recommendationItem}>
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

export default function AIAnalysis(props: AIAnalysisProps) {
  return (
    <ErrorBoundary>
      <AIAnalysisComponent {...props} />
    </ErrorBoundary>
  );
}