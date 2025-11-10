// @ts-nocheck
import React from 'react';
import { useParams } from 'react-router-dom';
import ProgressDashboard from '../components/progress/ProgressDashboard';

const ProgressPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">학습 진도</h1>
        <p className="mt-2 text-gray-600">
          내 학습 진행 상황과 업적을 확인하세요.
        </p>
      </div>

      <ProgressDashboard courseId={courseId} />
    </div>
  );
};

export default ProgressPage;
