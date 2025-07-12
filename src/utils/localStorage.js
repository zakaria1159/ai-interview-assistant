// src/utils/localStorage.js
import { dataHelpers } from './Api';

const STORAGE_KEY = 'interviewResults';
const MAX_STORED_RESULTS = 10;

export const saveResults = (evaluationResults, resumeText, jobPosting) => {
  try {
    const overallScore = dataHelpers.calculateOverallScore(evaluationResults);

    const resultData = {
      id: Date.now(),
      date: new Date().toISOString(),
      overallScore: Math.round(overallScore * 10) / 10,
      questionsCount: evaluationResults.length,
      results: evaluationResults,
      resumePreview: resumeText.substring(0, 100) + '...',
      jobPreview: jobPosting.substring(0, 100) + '...'
    };

    // Get existing results
    const existingResults = getStoredResults();
    
    // Add new result to beginning
    existingResults.unshift(resultData);
    
    // Keep only last MAX_STORED_RESULTS results
    if (existingResults.length > MAX_STORED_RESULTS) {
      existingResults.splice(MAX_STORED_RESULTS);
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingResults));
    
    return { success: true, message: 'Résultats sauvegardés avec succès!' };
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    throw new Error('Erreur lors de la sauvegarde');
  }
};

export const getStoredResults = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erreur lors de la lecture des résultats:', error);
    return [];
  }
};

export const deleteStoredResult = (resultId) => {
  try {
    const existingResults = getStoredResults();
    const filteredResults = existingResults.filter(result => result.id !== resultId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredResults));
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw new Error('Erreur lors de la suppression');
  }
};

export const clearAllResults = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw new Error('Erreur lors de la suppression');
  }
};