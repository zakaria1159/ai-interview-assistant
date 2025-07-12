// src/utils/mockData.js

export const sampleResume =
  `Marie Dubois - Développeuse Full Stack Senior
  
  PROFIL
  Développeuse passionnée avec 4 ans d'expérience en développement web moderne. 
  Spécialisée en React, Node.js et architectures cloud.
  
  EXPÉRIENCE
  Développeuse Senior | TechCorp Paris (2022-2024)
  • Développement d'applications React pour 500k+ utilisateurs
  • Lead technique sur refonte architecture microservices
  • Mentoring de 3 développeurs junior
  • Technologies: React, TypeScript, Node.js, PostgreSQL, AWS
  
  COMPÉTENCES TECHNIQUES
  Frontend: React, Vue.js, TypeScript, CSS3
  Backend: Node.js, Express, RESTful APIs, GraphQL
  Bases de données: PostgreSQL, MongoDB, Redis`;

export const sampleJobPosting = `RECHERCHE DÉVELOPPEUR REACT SENIOR
  
  InnovTech Solutions - Paris 11ème
  55-70k€ selon expérience | Hybride 3j/semaine
  
  MISSION
  Rejoignez notre équipe de 15 développeurs pour construire la prochaine génération de notre plateforme SaaS.
  
  RESPONSABILITÉS
  • Développer des interfaces React complexes et performantes
  • Architecturer des solutions frontend scalables
  • Mentoring des développeurs junior
  
  STACK: React 18, TypeScript, Node.js, PostgreSQL, AWS
  
  PROFIL RECHERCHÉ
  • 3+ ans d'expérience React
  • Maîtrise TypeScript et patterns React modernes
  • Expérience APIs REST et GraphQL`;

export const sampleResults = [
  {
    questionText: "Pouvez-vous me parler de votre expérience avec React ?",
    answerText: "J'ai 4 ans d'expérience avec React. J'ai développé plusieurs applications complexes, maîtrise les hooks comme useState et useEffect, et j'ai travaillé avec Redux pour la gestion d'état.",
    evalData: {
      overall_score: 8.2,
      scores: { pertinence: 9, clarté: 8, exemples: 8, compétences: 8, professionnalisme: 8 },
      feedback: "Excellente réponse qui démontre une solide expérience technique. Les exemples sont concrets et pertinents.",
      suggestions: "Ajoutez des métriques plus détaillées sur les projets réalisés et mentionnez les défis spécifiques surmontés."
    }
  },
  {
    questionText: "Comment gérez-vous l'état dans vos applications React ?",
    answerText: "J'utilise une approche progressive : useState et useEffect pour l'état local simple, useReducer pour la logique complexe, et Redux Toolkit pour l'état global.",
    evalData: {
      overall_score: 7.4,
      scores: { pertinence: 8, clarté: 7, exemples: 7, compétences: 8, professionnalisme: 7 },
      feedback: "Bonne compréhension des concepts de gestion d'état. La réponse couvre les aspects essentiels.",
      suggestions: "Mentionnez des exemples spécifiques d'utilisation et les critères de choix entre les différentes solutions."
    }
  },
  {
    questionText: "Décrivez un projet complexe que vous avez réalisé",
    answerText: "J'ai dirigé le développement d'une plateforme e-commerce avec architecture microservices. Le projet incluait un système de recommandations en temps réel et a généré 2M€ de CA.",
    evalData: {
      overall_score: 8.8,
      scores: { pertinence: 9, clarté: 9, exemples: 9, compétences: 8, professionnalisme: 9 },
      feedback: "Exemple très concret avec impact business mesurable. Démontre des compétences de leadership technique.",
      suggestions: "Détaillez les défis techniques rencontrés et les solutions d'architecture choisies."
    }
  }
];