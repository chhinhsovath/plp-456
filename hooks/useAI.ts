import { useState, useCallback } from 'react';
import axios from 'axios';
import type { 
  ObservationSuggestion, 
  ObservationAnalysis, 
  TeacherRecommendation 
} from '@/lib/ai/observation-ai';

// Hook for getting observation suggestions
export function useObservationSuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ObservationSuggestion | null>(null);

  const getSuggestions = useCallback(async (params: {
    subject: string;
    grade: number;
    chapter?: string;
    lesson?: string;
    language?: 'en' | 'km';
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/observation-suggestions', params);
      setSuggestions(response.data.suggestions);
      return response.data.suggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get suggestions';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getSuggestions, suggestions, loading, error };
}

// Hook for analyzing observations
export function useObservationAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ObservationAnalysis | null>(null);

  const analyzeObservation = useCallback(async (observationData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/analyze-observation', {
        observationData,
      });
      setAnalysis(response.data.analysis);
      return response.data.analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze observation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeObservation, analysis, loading, error };
}

// Hook for teacher recommendations
export function useTeacherRecommendations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<TeacherRecommendation | null>(null);

  const getRecommendations = useCallback(async (params: {
    teacherHistory: any[];
    latestObservation: any;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/teacher-recommendations', params);
      setRecommendations(response.data.recommendations);
      return response.data.recommendations;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getRecommendations, recommendations, loading, error };
}

// Hook for translations
export function useTranslation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (params: {
    text?: string;
    texts?: string[];
    sourceLang: 'en' | 'km';
    targetLang: 'en' | 'km';
    context?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/translate', params);
      return params.texts ? response.data.translations : response.data.translation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to translate';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { translate, loading, error };
}