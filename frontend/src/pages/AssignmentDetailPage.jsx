/**
 * Assignment Detail Page
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentDetail from '../components/assignments/AssignmentDetail';
import { useAuth } from '../contexts/AuthContext';

const AssignmentDetailPage = () => {
  const { courseId, assignmentId } = useParams();
  const { profile } = useAuth();

  // TODO: Get actual role from course membership
  const role = 'student';

  return (
    <div className="px-4 py-8">
      <AssignmentDetail
        assignmentId={assignmentId}
        courseId={courseId}
        role={role}
      />
    </div>
  );
};

export default AssignmentDetailPage;
