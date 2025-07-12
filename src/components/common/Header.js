// src/components/common/Header.js
import React from 'react';
import Button from './Button'; // Reuse your custom Button

const Header = ({
  title = 'Entretien IA',
  subtitle,
  showActions = false,
  onTestConnection,
  onFillSample,
  onShowDemo,
}) => {
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon" aria-hidden="true">🧠</div>
        <h1 className="logo-text">{title}</h1>
      </div>

      {subtitle && <p className="tagline">{subtitle}</p>}

      {showActions && (
        <div className="actions">
          <Button variant="outline" onClick={onTestConnection}>
            Tester connexion
          </Button>
          <Button variant="outline" onClick={onFillSample}>
            Données d'exemple
          </Button>
          <Button variant="secondary" onClick={onShowDemo}>
            Voir démo
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
