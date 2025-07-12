'use client';
import React, { useEffect, useState } from 'react';
import InterviewPage from '../../components/interview/InterviewPage';

const Interview = () => {
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    type AnswerResult = {
        questionText: string;
        answerText: string;
        evalData: any;
    };
    const [answers, setAnswers] = useState<AnswerResult[]>([]);
    // Simulate fetching questions on mount
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/generate-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resumeText: 'Votre CV ici...',
                        jobPosting: 'Offre d\'emploi ici...'
                    })
                });
                const data = await res.json();
                if (data.success) {
                    setQuestions(data.questions);
                } else {
                    setError('Failed to fetch questions');
                }
            } catch (err) {
                setError('Error fetching questions');
            }
        };

        fetchQuestions();
    }, []);

    const onSubmitAnswer = async () => {
        if (!userAnswer.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/evaluate-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: questions[currentQuestion],
                    answer: userAnswer
                })
            });

            const data = await res.json();
            if (data.success) {
                setAnswers((prev) => [...prev, { questionText: questions[currentQuestion], answerText: userAnswer, evalData: data.evaluation }]);
                setUserAnswer('');
            } else {
                setError('Evaluation failed.');
            }
        } catch (err) {
            setError('An error occurred during evaluation.');
        } finally {
            setIsLoading(false);
        }
    };

    const onNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setUserAnswer('');
        }
    };

    const onFinishInterview = () => {
        // You can store in context or navigate to /results page with results
        console.log('Interview finished', answers);
        // Example redirect:
        // router.push('/results');
    };

    if (questions.length === 0) {
        return <div className="container">📄 Loading questions...</div>;
    }

    return (
        <InterviewPage
            questions={questions}
            currentQuestion={currentQuestion}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            onSubmitAnswer={onSubmitAnswer}
            onNextQuestion={onNextQuestion}
            onFinishInterview={onFinishInterview}
            isLoading={isLoading}
            error={error}
        />
    );
};

export default Interview;
