import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QuizList from '../components/quiz/QuizList';
import { useAuth } from '../contexts/AuthContext';

const QuizPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const userRole = user?.role || 'student';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">퀴즈 & 시험</h1>
        <p className="mt-2 text-gray-600">
          퀴즈와 시험을 관리하고 응시하세요.
        </p>
      </div>

      <QuizList courseId={courseId} userRole={userRole} />
    </div>
  );
};

export default QuizPage;
