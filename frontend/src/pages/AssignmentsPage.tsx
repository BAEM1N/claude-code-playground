/**
// @ts-nocheck
 * Assignments Page
// @ts-nocheck
 */
// @ts-nocheck
import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentList from '../components/assignments/AssignmentList';

const AssignmentsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  // TODO: Get actual role from course membership
  const role = 'student'; // This should come from course membership

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AssignmentList courseId={courseId} role={role} />
    </div>
  );
};

export default AssignmentsPage;
