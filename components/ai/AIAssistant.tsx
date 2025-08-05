"use client";

import { useState } from 'react';
import { useObservationSuggestions } from '@/hooks/useAI';
import type { ObservationSuggestion } from '@/lib/ai/zai-client';
import styles from './AIAssistant.module.css';

interface AIAssistantProps {
  subject: string;
  grade: number;
  chapter?: string;
  lesson?: string;
  onSuggestionsReceived?: (suggestions: Partial<ObservationSuggestion>) => void;
}

export default function AIAssistant({
  subject,
  grade,
  chapter,
  lesson,
  onSuggestionsReceived,
}: AIAssistantProps) {
  const { getSuggestions, suggestions, loading, error } = useObservationSuggestions();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'km'>('en');

  const handleGetSuggestions = async () => {
    if (!subject || !grade) {
      alert('Please provide subject and grade first');
      return;
    }

    try {
      const result = await getSuggestions({
        subject,
        grade,
        chapter,
        lesson,
        language,
      });
      
      if (onSuggestionsReceived) {
        onSuggestionsReceived(result);
      }
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  };

  const applySuggestion = (field: string, value: any) => {
    // This would be connected to the form state management
    console.log('Applying suggestion:', field, value);
    if (onSuggestionsReceived) {
      onSuggestionsReceived({ [field]: value });
    }
  };

  return (
    <div className={styles.aiAssistant}>
      <div className={styles.header}>
        <button
          onClick={handleGetSuggestions}
          disabled={loading || !subject || !grade}
          className={styles.aiButton}
        >
          {loading ? 'Getting AI Suggestions...' : '🤖 Get AI Suggestions'}
        </button>
        
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'km')}
          className={styles.languageSelect}
        >
          <option value="en">English</option>
          <option value="km">ខ្មែរ (Khmer)</option>
        </select>
      </div>

      {error && (
        <div className={styles.error}>
          Error: {error}
        </div>
      )}

      {isOpen && suggestions && (
        <div className={styles.suggestionsPanel}>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
          >
            ✕
          </button>

          <h3>AI Suggestions</h3>

          {suggestions.lessonTitle && (
            <div className={styles.suggestionItem}>
              <h4>Lesson Title</h4>
              <p>{suggestions.lessonTitle}</p>
              <button
                onClick={() => applySuggestion('title', suggestions.lessonTitle)}
                className={styles.applyButton}
              >
                Apply
              </button>
            </div>
          )}

          {suggestions.lessonObjectives && suggestions.lessonObjectives.length > 0 && (
            <div className={styles.suggestionItem}>
              <h4>Lesson Objectives</h4>
              <ul>
                {suggestions.lessonObjectives.map((obj: string, idx: number) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
              <button
                onClick={() => applySuggestion('objectives', suggestions.lessonObjectives)}
                className={styles.applyButton}
              >
                Apply All
              </button>
            </div>
          )}

          {suggestions.teachingMethods && suggestions.teachingMethods.length > 0 && (
            <div className={styles.suggestionItem}>
              <h4>Teaching Methods</h4>
              <ul>
                {suggestions.teachingMethods.map((method: string, idx: number) => (
                  <li key={idx}>{method}</li>
                ))}
              </ul>
              <button
                onClick={() => applySuggestion('methods', suggestions.teachingMethods)}
                className={styles.applyButton}
              >
                Apply All
              </button>
            </div>
          )}

          {suggestions.evaluationCriteria && suggestions.evaluationCriteria.length > 0 && (
            <div className={styles.suggestionItem}>
              <h4>Evaluation Criteria</h4>
              <ul>
                {suggestions.evaluationCriteria.map((criteria: string, idx: number) => (
                  <li key={idx}>{criteria}</li>
                ))}
              </ul>
              <button
                onClick={() => applySuggestion('criteria', suggestions.evaluationCriteria)}
                className={styles.applyButton}
              >
                Apply All
              </button>
            </div>
          )}

          {suggestions.expectedOutcomes && suggestions.expectedOutcomes.length > 0 && (
            <div className={styles.suggestionItem}>
              <h4>Expected Outcomes</h4>
              <ul>
                {suggestions.expectedOutcomes.map((outcome: string, idx: number) => (
                  <li key={idx}>{outcome}</li>
                ))}
              </ul>
              <button
                onClick={() => applySuggestion('outcomes', suggestions.expectedOutcomes)}
                className={styles.applyButton}
              >
                Apply All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}