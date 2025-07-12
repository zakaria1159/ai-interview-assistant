import { dataHelpers } from './api';

export interface Evaluation {
  question: string;
  answer: string;
  evaluation: {
    overall_score: number;
    scores: { [key: string]: number };
    feedback: string;
    suggestions: string;
  };
}

export const exportToPDF = async (evaluationResults: Evaluation[]) => {
  try {
    const jsPDF = (await import('jspdf')).default;

    // Map Evaluation objects to EvaluationResult format for calculateOverallScore
    const mappedResults = evaluationResults.map(result => ({
      questionText: result.question,
      answerText: result.answer,
      evalData: result.evaluation
    }));

    const overallScore = dataHelpers.calculateOverallScore(mappedResults);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résultats Entretien IA', pageWidth / 2, 30, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    pdf.text(`Généré le ${date}`, pageWidth / 2, 40, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Score Global', 20, 60);

    pdf.setFontSize(32);
    pdf.text(`${Math.round(overallScore * 10) / 10}/10`, 20, 80);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const performance =
      overallScore >= 8
        ? 'Performance excellente'
        : overallScore >= 6
        ? 'Bonne performance'
        : overallScore >= 4
        ? 'Performance correcte'
        : "Points d'amélioration identifiés";
    pdf.text(performance, 20, 90);

    pdf.setDrawColor(251, 191, 36);
    pdf.setLineWidth(2);
    pdf.line(20, 100, pageWidth - 20, 100);

    let yPosition = 120;

    evaluationResults.forEach((result, index) => {
      const evalData = result.evaluation ?? {};
      const scores = evalData.scores ?? {};

      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const score = evalData.overall_score ?? 0;
      pdf.text(`Question ${index + 1} - Score: ${score}/10`, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const questionText = result.question || 'Question non disponible';
      const questionLines = pdf.splitTextToSize(questionText, pageWidth - 40);
      pdf.text(questionLines, 20, yPosition);
      yPosition += questionLines.length * 5 + 5;

      const answerText = result.answer || 'Réponse non disponible';
      const shortAnswer = answerText.length > 200 ? answerText.substring(0, 200) + '...' : answerText;
      const answerLines = pdf.splitTextToSize(`Réponse: ${shortAnswer}`, pageWidth - 40);
      pdf.text(answerLines, 20, yPosition);
      yPosition += answerLines.length * 5 + 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Scores détaillés:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      Object.entries(scores).forEach(([key, value]) => {
        pdf.text(`${key}: ${value}/10`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Feedback:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      const feedback = evalData.feedback ?? 'Non disponible';
      const feedbackLines = pdf.splitTextToSize(feedback, pageWidth - 40);
      pdf.text(feedbackLines, 20, yPosition);
      yPosition += feedbackLines.length * 5 + 10;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Suggestions:', 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      const suggestions = evalData.suggestions ?? 'Non disponible';
      const suggestionLines = pdf.splitTextToSize(suggestions, pageWidth - 40);
      pdf.text(suggestionLines, 20, yPosition);
      yPosition += suggestionLines.length * 5 + 15;

      if (index < evaluationResults.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 10;
      }
    });

    const fileName = `entretien-ia-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw new Error("Erreur lors de l'export PDF");
  }
};