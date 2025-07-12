# 🤖 AI Interview Assistant

A comprehensive AI-powered interview platform that simulates realistic job interviews with voice interaction, real-time evaluation, and detailed feedback.

## ✨ Features

### 🎤 **Voice-First Interview Experience**
- **AI Interviewer**: Questions are spoken aloud using OpenAI's high-quality TTS
- **Voice Responses**: Candidates can respond using speech-to-text (Whisper AI)
- **Natural Flow**: Mimics real interview conversations
- **Multiple Voices**: Choose from 6 different AI voice personalities

### 📊 **Intelligent Evaluation**
- **Real-time Analysis**: Powered by GPT-4 for accurate assessment
- **Multi-criteria Scoring**: Evaluates 5 key areas:
  - Pertinence (Relevance)
  - Clarté (Clarity) 
  - Exemples (Examples)
  - Compétences (Skills)
  - Professionnalisme (Professionalism)
- **Detailed Feedback**: Constructive comments and improvement suggestions
- **Overall Score**: Weighted evaluation with performance insights

### 📝 **Flexible Input Methods**
- **Voice Recording**: Natural speech-to-text conversion
- **Text Input**: Traditional typing option
- **Edit Transcriptions**: Review and modify voice responses
- **Seamless Switching**: Toggle between input modes anytime

### 📄 **Professional Reporting**
- **PDF Export**: Generate comprehensive interview reports
- **Detailed Breakdowns**: Question-by-question analysis
- **Performance Insights**: Strengths and areas for improvement
- **Professional Formatting**: Ready for HR and hiring managers

### 🎨 **Clean Design**
- **Modern UI**: Clean yellow/black/white design system
- **Mobile Responsive**: Works on all devices
- **Accessibility**: Keyboard navigation and screen reader support
- **Professional Feel**: Enterprise-ready interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-interview-assistant.git
   cd ai-interview-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   ├── interview/        # Interview-specific components
│   │   ├── results/          # Results display components
│   │   └── setup/            # Initial setup components
│   ├── pages/
│   │   ├── api/              # API endpoints
│   │   │   ├── evaluate-answer.ts    # Answer evaluation
│   │   │   ├── generate-questions.ts # Question generation
│   │   │   ├── transcribe.ts         # Speech-to-text
│   │   │   └── text-to-speech.ts     # Text-to-speech
│   │   └── index.tsx         # Main application
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── styles/               # Global styles
├── public/                   # Static assets
└── README.md
```

## 🔧 Configuration

### API Endpoints

| Endpoint | Purpose | Input | Output |
|----------|---------|-------|--------|
| `/api/generate-questions` | Generate interview questions | Resume + Job posting | Array of questions |
| `/api/evaluate-answer` | Evaluate responses | Question + Answer | Detailed scores & feedback |
| `/api/transcribe` | Speech-to-text | Audio file | Transcribed text |
| `/api/text-to-speech` | Text-to-speech | Text + Voice settings | MP3 audio |

### Voice Options

- **Nova**: Professional female voice (recommended)
- **Alloy**: Neutral, versatile voice
- **Echo**: Clear masculine voice
- **Fable**: Expressive feminine voice
- **Onyx**: Deep masculine voice
- **Shimmer**: Soft feminine voice

## 💡 Usage Examples

### Basic Interview Flow
1. **Setup**: Upload resume and job description
2. **Generate**: AI creates relevant interview questions
3. **Interview**: AI asks questions aloud, candidate responds
4. **Evaluate**: Real-time scoring and feedback
5. **Results**: Comprehensive report with improvement areas

### Advanced Features
- **Voice Customization**: Choose interviewer voice and speed
- **Multi-format Export**: PDF reports, JSON data
- **Batch Processing**: Multiple candidates, same questions
- **Custom Rubrics**: Adjust evaluation criteria

## 🔒 Privacy & Security

- **No Data Storage**: Audio files are processed and immediately deleted
- **Secure API**: Environment variables for sensitive keys
- **Local Processing**: Transcriptions happen server-side, not stored
- **GDPR Compliant**: No personal data retention

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: CSS Modules, Custom Design System
- **AI/ML**: OpenAI GPT-4, Whisper, TTS
- **Audio**: Web Audio API, MediaRecorder API
- **PDF**: jsPDF for report generation
- **Deployment**: Vercel-ready

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Evaluation Criteria

### Scoring System (1-10 scale)

| Criteria | Description | Weight |
|----------|-------------|--------|
| **Pertinence** | Relevance to the question asked | 20% |
| **Clarté** | Clarity and structure of response | 20% |
| **Exemples** | Quality and relevance of examples | 20% |
| **Compétences** | Technical/professional skills demonstrated | 20% |
| **Professionnalisme** | Communication style and professionalism | 20% |

### Performance Levels

- **9-10**: Exceptional performance
- **7-8**: Strong performance  
- **5-6**: Adequate performance
- **3-4**: Needs improvement
- **1-2**: Significant issues

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - automatic deployments on push to main

### Environment Variables for Production

```
OPENAI_API_KEY=your_production_openai_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📈 Roadmap

- [ ] **Multi-language Support**: Support for multiple interview languages
- [ ] **Video Analysis**: Facial expression and body language evaluation
- [ ] **Team Interviews**: Multiple interviewers simulation
- [ ] **Integration APIs**: Connect with ATS systems
- [ ] **Advanced Analytics**: Candidate comparison dashboards
- [ ] **Custom Question Banks**: Industry-specific question sets

## 🐛 Troubleshooting

### Common Issues

**Audio not working?**
- Check microphone permissions in browser
- Ensure HTTPS (required for microphone access)
- Try different browsers (Chrome recommended)

**TTS not playing?**
- Check browser audio permissions
- Verify OpenAI API key is valid
- Check network connection

**Evaluation errors?**
- Verify OpenAI API key has sufficient credits
- Check API rate limits
- Ensure questions and answers are not empty

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4, Whisper, and TTS APIs
- **Next.js** team for the fantastic framework
- **Vercel** for seamless deployment
- **Contributors** who help improve this project

## 📞 Support

For support, email [your-email@example.com] or create an issue on GitHub.

---

**Made with ❤️ for better interviews**