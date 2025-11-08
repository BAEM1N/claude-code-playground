/**
 * Learning Track List Component
 * Displays all available learning tracks
 */
import React from 'react';
import { useTracks } from '../../hooks/useLearning';
import { Link } from 'react-router-dom';

const LearningTrackList = () => {
  const { data: tracks = [], isLoading, error } = useTracks();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700">트랙을 불러오는데 실패했습니다.</p>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">아직 학습 트랙이 없습니다.</p>
        <p className="text-gray-400 text-sm mt-2">관리자에게 문의하세요.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">학습 트랙</h1>
        <p className="text-gray-600 mt-2">
          체계적인 학습 경로를 따라 전문성을 키워보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <Link
            key={track.id}
            to={`/learning/tracks/${track.id}`}
            className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
          >
            {track.thumbnail_url && (
              <img
                src={track.thumbnail_url}
                alt={track.title}
                className="w-full h-48 object-cover"
              />
            )}
            {!track.thumbnail_url && (
              <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {track.title[0]}
                </span>
              </div>
            )}

            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {track.title}
              </h3>
              {track.description && (
                <p className="text-gray-600 text-sm line-clamp-3">
                  {track.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LearningTrackList;
