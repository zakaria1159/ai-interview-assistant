// src/components/results/ExportActions.tsx
import React from 'react';
import Button from '../common/Button';

interface ExportActionsProps {
  onSave: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
}

const ExportActions: React.FC<ExportActionsProps> = ({ onSave, onExportPDF, isExporting }) => {
  return (
    <div className="export-actions">
      <Button variant="outline" onClick={onSave}>
        💾 Sauvegarder
      </Button>
      <Button variant="primary" loading={isExporting} onClick={onExportPDF}>
        {isExporting ? 'Export en cours...' : '📄 Exporter PDF'}
      </Button>
    </div>
  );
};

export default ExportActions;
