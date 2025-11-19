import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveQuizAPI } from '../../services/api';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  time_limit: number;
}

interface Participant {
  id: string;
  name: string;
  score: number;
  answered: boolean;
}

const LiveQuizSession: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizEnded, setQuizEnded] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    loadCurrentQuestion();
    loadParticipants();

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadCurrentQuestion();
      loadParticipants();
    }, 2000);

    return () => clearInterval(interval);
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentQuestion && !submitted) {
      handleSubmitAnswer();
    }
    return undefined;
  }, [timeLeft, submitted, currentQuestion]);

  const loadCurrentQuestion = async () => {
    try {
      const response = await liveQuizAPI.getCurrentQuestion(quizId!);
      if (response.data.ended) {
        setQuizEnded(true);
        loadLeaderboard();
      } else if (response.data.question) {
        const newQuestion = response.data.question;
        if (!currentQuestion || currentQuestion.id !== newQuestion.id) {
          setCurrentQuestion(newQuestion);
          setTimeLeft(newQuestion.time_limit);
          setSelectedAnswer(null);
          setSubmitted(false);
          setShowResults(false);
          setQuestionNumber(response.data.question_number || 1);
          setTotalQuestions(response.data.total_questions || 10);
        }
        if (response.data.show_results) {
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Failed to load current question:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await liveQuizAPI.getParticipants(quizId!);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await liveQuizAPI.getLeaderboard(quizId!);
      setLeaderboard(response.data || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || submitted) return;

    setSubmitted(true);
    try {
      await liveQuizAPI.submitAnswer(quizId!, currentQuestion.id, selectedAnswer);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white text-xl">Joining quiz...</p>
        </div>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Quiz Ended!</h1>
            <p className="text-purple-200">Final Results</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-100 border-2 border-yellow-400'
                      : index === 1
                      ? 'bg-gray-100 border-2 border-gray-400'
                      : index === 2
                      ? 'bg-orange-100 border-2 border-orange-400'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-gray-700">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{participant.name}</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">{participant.score} pts</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/live-quiz')}
              className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto flex items-center justify-center">
              <span className="text-4xl">⏳</span>
            </div>
          </div>
          <p className="mt-6 text-white text-xl">Waiting for the host to start...</p>
          <p className="mt-2 text-gray-400">{participants.length} participants joined</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black bg-opacity-30 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="text-white">
            <span className="text-sm opacity-75">Question</span>
            <span className="ml-2 text-xl font-bold">{questionNumber}/{totalQuestions}</span>
          </div>
          <div className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
          <div className="text-white text-sm">
            {participants.filter(p => p.answered).length}/{participants.length} answered
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {currentQuestion.text}
          </h2>

          {/* Options */}
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !submitted && setSelectedAnswer(option)}
                  disabled={submitted}
                  className={`p-6 rounded-xl text-left text-lg font-medium transition-all ${
                    submitted
                      ? selectedAnswer === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                      : selectedAnswer === option
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } ${!submitted && 'cursor-pointer'}`}
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-black bg-opacity-20 text-center mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {['True', 'False'].map((option) => (
                <button
                  key={option}
                  onClick={() => !submitted && setSelectedAnswer(option)}
                  disabled={submitted}
                  className={`p-8 rounded-xl text-xl font-bold transition-all ${
                    submitted
                      ? selectedAnswer === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                      : selectedAnswer === option
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } ${!submitted && 'cursor-pointer'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'short_answer' && (
            <input
              type="text"
              value={selectedAnswer || ''}
              onChange={(e) => !submitted && setSelectedAnswer(e.target.value)}
              disabled={submitted}
              placeholder="Type your answer..."
              className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {/* Submit Button */}
          {!submitted && (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="w-full mt-6 px-6 py-4 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          )}

          {submitted && !showResults && (
            <div className="mt-6 text-center">
              <p className="text-xl text-gray-600">Answer submitted! Waiting for others...</p>
            </div>
          )}
        </div>

        {/* Participants sidebar on larger screens */}
        <div className="hidden lg:block fixed right-4 top-24 w-64 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Participants ({participants.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {participants.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-white">{p.name}</span>
                <span className={p.answered ? 'text-green-400' : 'text-gray-400'}>
                  {p.answered ? '✓' : '...'}
                </span>
              </div>
            ))}
            {participants.length > 10 && (
              <p className="text-gray-400 text-xs">+{participants.length - 10} more</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveQuizSession;
