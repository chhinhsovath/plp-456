"use client";

import { useState } from 'react';
import { useObservationSuggestions, useObservationAnalysis, useTranslation } from '@/hooks/useAI';
import AIAssistant from '@/components/ai/AIAssistant';
import ObservationAnalysis from '@/components/ai/ObservationAnalysis';
import styles from './ai-demo.module.css';

// Sample observation data for demo
const sampleObservation = {
  school: "Sample Primary School",
  nameOfTeacher: "John Doe",
  subject: "Mathematics",
  grade: 5,
  chapter: "Fractions",
  lesson: "Adding Fractions",
  title: "Adding Fractions with Different Denominators",
  inspectionDate: new Date().toISOString(),
  totalMale: 15,
  totalFemale: 18,
  totalAbsent: 3,
  evaluationData: {
    indicator_1: "4",
    indicator_2: "3",
    indicator_3: "5",
    indicator_4: "4",
  },
  generalNotes: "Teacher showed good command of the subject matter. Students were engaged throughout the lesson.",
};

export default function AIDemoPage() {
  const [activeDemo, setActiveDemo] = useState<'suggestions' | 'analysis' | 'translation'>('suggestions');
  const { translate, loading: translationLoading } = useTranslation();
  const [translationResult, setTranslationResult] = useState('');
  const [textToTranslate, setTextToTranslate] = useState('The teacher demonstrated excellent classroom management skills.');

  const handleTranslate = async () => {
    try {
      const result = await translate({
        text: textToTranslate,
        sourceLang: 'en',
        targetLang: 'km',
        context: 'Educational observation feedback',
      });
      setTranslationResult(result);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>AI Features Demo</h1>
        <p>Experience the power of Z.AI GLM-4.5 integration in the observation platform</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeDemo === 'suggestions' ? styles.active : ''}`}
          onClick={() => setActiveDemo('suggestions')}
        >
          Form Suggestions
        </button>
        <button
          className={`${styles.tab} ${activeDemo === 'analysis' ? styles.active : ''}`}
          onClick={() => setActiveDemo('analysis')}
        >
          Observation Analysis
        </button>
        <button
          className={`${styles.tab} ${activeDemo === 'translation' ? styles.active : ''}`}
          onClick={() => setActiveDemo('translation')}
        >
          Translation
        </button>
      </div>

      <div className={styles.content}>
        {activeDemo === 'suggestions' && (
          <div className={styles.demoSection}>
            <h2>Intelligent Form Assistance</h2>
            <p>Get AI-powered suggestions for lesson planning based on subject and grade level.</p>
            
            <div className={styles.demoForm}>
              <div className={styles.formInputs}>
                <div>
                  <label>Subject: Mathematics</label>
                </div>
                <div>
                  <label>Grade: 5</label>
                </div>
                <div>
                  <label>Chapter: Fractions</label>
                </div>
              </div>

              <AIAssistant
                subject="Mathematics"
                grade={5}
                chapter="Fractions"
                lesson="Adding Fractions"
                onSuggestionsReceived={(suggestions) => {
                  console.log('Received suggestions:', suggestions);
                }}
              />
            </div>
          </div>
        )}

        {activeDemo === 'analysis' && (
          <div className={styles.demoSection}>
            <h2>AI-Powered Observation Analysis</h2>
            <p>See how AI analyzes observation data to provide insights and recommendations.</p>
            
            <ObservationAnalysis
              observationData={sampleObservation}
              showRecommendations={true}
            />
          </div>
        )}

        {activeDemo === 'translation' && (
          <div className={styles.demoSection}>
            <h2>Multi-Language Support</h2>
            <p>Translate educational content between English and Khmer.</p>
            
            <div className={styles.translationDemo}>
              <div className={styles.translationInput}>
                <h3>English Text</h3>
                <textarea
                  value={textToTranslate}
                  onChange={(e) => setTextToTranslate(e.target.value)}
                  rows={4}
                  placeholder="Enter text to translate..."
                />
                <button
                  onClick={handleTranslate}
                  disabled={translationLoading}
                  className={styles.translateButton}
                >
                  {translationLoading ? 'Translating...' : 'Translate to Khmer'}
                </button>
              </div>
              
              {translationResult && (
                <div className={styles.translationOutput}>
                  <h3>Khmer Translation</h3>
                  <div className={styles.translationResult}>
                    {translationResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.features}>
        <h2>Key AI Features</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>🤖 Smart Suggestions</h3>
            <p>Get contextual suggestions for lesson objectives, teaching methods, and evaluation criteria.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>📊 Deep Analysis</h3>
            <p>Analyze teaching patterns and provide actionable feedback with performance scores.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>🌍 Language Support</h3>
            <p>Seamless translation between English and Khmer for all educational content.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>💡 Recommendations</h3>
            <p>Personalized professional development suggestions based on observation history.</p>
          </div>
        </div>
      </div>
    </div>
  );
}