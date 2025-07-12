// src/components/setup/SetupPage.js
import React from 'react';
import Header from '../common/Header';
import Alert from '../common/Alert';
import Button from '../common/Button';
import CVInput from './CVInput';
import JobInput from './JobInput';

const SetupPage = ({
  resumeText,
  setResumeText,
  jobPosting,
  setJobPosting,
  error,
  isLoading,
  onTestConnection,
  onFillSample,
  onShowDemo,
  onGenerateQuestions
}) => {
  return (
    <div className="app">
      <div className="container">
        <Header 
          title="Entretien IA"
          subtitle="Préparez-vous avec un entretien d'embauche personnalisé et intelligent"
          showActions
          onTestConnection={onTestConnection}
          onFillSample={onFillSample}
          onShowDemo={onShowDemo}
        />

        {error && <Alert>{error}</Alert>}

        <div className="main-content">
          <CVInput 
            value={resumeText}
            onChange={setResumeText}
          />
          <JobInput 
            value={jobPosting}
            onChange={setJobPosting}
          />
        </div>

        <div className="generate">
          <Button
            variant="primary"
            size="large"
            loading={isLoading}
            disabled={!resumeText.trim() || !jobPosting.trim()}
            onClick={onGenerateQuestions}
          >
            {isLoading ? 'Génération en cours...' : 'Générer l\'entretien'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;