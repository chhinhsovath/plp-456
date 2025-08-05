"use client";

import { useEffect, useState } from 'react';
import { useObservationAnalysis, useTeacherRecommendations } from '@/hooks/useAI';
import type { ObservationAnalysis as ObservationAnalysisType, TeacherRecommendation } from '@/lib/ai/zai-client';
import styles from './ObservationAnalysis.module.css';

interface ObservationAnalysisProps {
  observationData: any;
  teacherHistory?: any[];
  showRecommendations?: boolean;
}

export default function ObservationAnalysis({
  observationData,
  teacherHistory = [],
  showRecommendations = true,
}: ObservationAnalysisProps) {
  const { analyzeObservation, analysis, loading: analysisLoading } = useObservationAnalysis();
  const { getRecommendations, recommendations, loading: recLoading } = useTeacherRecommendations();
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations'>('analysis');

  useEffect(() => {
    if (observationData) {
      analyzeObservation(observationData);
    }
  }, [observationData]);

  const handleGetRecommendations = async () => {
    if (observationData) {
      await getRecommendations({
        teacherHistory,
        latestObservation: observationData,
      });
      setActiveTab('recommendations');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  if (analysisLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Analyzing observation data...</p>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.header}>
        <h2>AI-Powered Analysis</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'analysis' ? styles.active : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          {showRecommendations && (
            <button
              className={`${styles.tab} ${activeTab === 'recommendations' ? styles.active : ''}`}
              onClick={handleGetRecommendations}
              disabled={recLoading}
            >
              {recLoading ? 'Loading...' : 'Recommendations'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'analysis' && (
        <div className={styles.content}>
          <div className={styles.scoreSection}>
            <h3>Overall Performance Score</h3>
            <div className={styles.scoreCircle} style={{ borderColor: getScoreColor(analysis.overallScore) }}>
              <span className={styles.scoreNumber} style={{ color: getScoreColor(analysis.overallScore) }}>
                {analysis.overallScore}
              </span>
              <span className={styles.scoreMax}>/10</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Teaching Strengths</h3>
            <ul className={styles.strengthsList}>
              {analysis.strengths.map((strength: string, idx: number) => (
                <li key={idx} className={styles.strengthItem}>
                  <span className={styles.icon}>✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Areas for Improvement</h3>
            <ul className={styles.improvementList}>
              {analysis.areasForImprovement.map((area: string, idx: number) => (
                <li key={idx} className={styles.improvementItem}>
                  <span className={styles.icon}>!</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Recommendations</h3>
            <ul className={styles.recommendationsList}>
              {analysis.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className={styles.recommendationItem}>
                  <span className={styles.icon}>→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Detailed Feedback</h3>
            <p className={styles.feedback}>{analysis.detailedFeedback}</p>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && recommendations && (
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Professional Development</h3>
            <ul className={styles.developmentList}>
              {recommendations.professionalDevelopment.map((item: string, idx: number) => (
                <li key={idx} className={styles.developmentItem}>
                  <span className={styles.badge}>Course</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Recommended Resources</h3>
            <ul className={styles.resourceList}>
              {recommendations.resources.map((resource: string, idx: number) => (
                <li key={idx} className={styles.resourceItem}>
                  <span className={styles.badge}>Resource</span>
                  {resource}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Implementation Strategies</h3>
            <ul className={styles.strategyList}>
              {recommendations.strategies.map((strategy: string, idx: number) => (
                <li key={idx} className={styles.strategyItem}>
                  <span className={styles.number}>{idx + 1}</span>
                  {strategy}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Timeline</h3>
            <div className={styles.timeline}>
              <span className={styles.timelineIcon}>📅</span>
              <p>{recommendations.timeline}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}