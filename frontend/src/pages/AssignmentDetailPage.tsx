/**
// @ts-nocheck
 * Assignment Detail Page
// @ts-nocheck
 */
// @ts-nocheck
import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentDetail from '../components/assignments/AssignmentDetail';

const AssignmentDetailPage: React.FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();

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
