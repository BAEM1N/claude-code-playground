import React from 'react';
import { useQuizzes } from '../../hooks/useQuizzes';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const QuizList = ({ courseId, userRole }) => {
  const { data: quizzes = [], isLoading, error } = useQuizzes(courseId);

  const getQuizStatus = (quiz) => {
    const now = new Date();
    const startTime = new Date(quiz.start_time);
    const endTime = new Date(quiz.end_time);

    if (now < startTime) return { text: '예정', color: 'gray' };
    if (now > endTime) return { text: '종료', color: 'red' };
    return { text: '진행중', color: 'green' };
  };

  const getQuizTypeText = (type) => {
    const types = {
      quiz: '퀴즈',
      midterm: '중간고사',
      final: '기말고사',
      practice: '연습문제',
    };
    return types[type] || type;
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error?.message || '퀴즈 목록을 불러오는데 실패했습니다.'} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">퀴즈 / 시험</h2>
        {(userRole === 'instructor' || userRole === 'assistant') && (
          <button
            onClick={() => window.location.href = '#create-quiz'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            + 새 퀴즈
          </button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">퀴즈가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            return (
              <div
                key={quiz.id}
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{quiz.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                        {status.text}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {getQuizTypeText(quiz.quiz_type)}
                      </span>
                    </div>

                    {quiz.description && (
                      <p className="text-gray-600 mb-3">{quiz.description}</p>
                    )}

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        📅 {new Date(quiz.start_time).toLocaleString('ko-KR')} ~
                        {new Date(quiz.end_time).toLocaleString('ko-KR')}
                      </p>
                      {quiz.duration_minutes && (
                        <p>⏱️ 제한 시간: {quiz.duration_minutes}분</p>
                      )}
                      <p>📊 총 점수: {quiz.total_points}점</p>
                      <p>🔄 시도 가능 횟수: {quiz.max_attempts}회</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {userRole === 'student' && status.text === '진행중' && (
                      <button
                        onClick={() => window.location.href = `#take-quiz/${quiz.id}`}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        시작하기
                      </button>
                    )}

                    {(userRole === 'instructor' || userRole === 'assistant') && (
                      <button
                        onClick={() => window.location.href = `#quiz/${quiz.id}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        관리
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizList;
