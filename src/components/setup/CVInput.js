// src/components/setup/CVInput.js
import React from 'react';

const CVInput = ({ value, onChange }) => {
  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Votre CV</h2>
        <p className="section-description">Collez le contenu de votre CV en texte</p>
      </div>
      <div className="input-container">
        <textarea
          className="textarea"
          placeholder="Marie Dubois - Développeuse Full Stack Senior

PROFIL
Développeuse passionnée avec 4 ans d'expérience...

EXPÉRIENCE
Développeuse Senior | TechCorp Paris
• Développement d'applications React pour 500k+ utilisateurs..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="char-count">{value.length} caractères</div>
      </div>
    </section>
  );
};

export default CVInput;