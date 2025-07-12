// src/components/setup/JobInput.js
import React from 'react';

const JobInput = ({ value, onChange }) => {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Offre d'emploi</h2>
        <p className="section-description">Collez l'offre d'emploi complète</p>
      </div>
      <div className="input-container">
        <textarea
          className="textarea"
          placeholder="RECHERCHE DÉVELOPPEUR REACT SENIOR

InnovTech Solutions - Paris
55-70k€ selon expérience

MISSION
Rejoignez notre équipe pour développer..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="char-count">{value.length} caractères</div>
      </div>
    </section>
  );
};

export default JobInput;