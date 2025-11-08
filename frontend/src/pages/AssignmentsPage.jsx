/**
 * Assignments Page
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentList from '../components/assignments/AssignmentList';
import { useAuth } from '../contexts/AuthContext';

const AssignmentsPage = () => {
  const { courseId } = useParams();
  const { profile } = useAuth();

  // TODO: Get actual role from course membership
  const role = 'student'; // This should come from course membership

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AssignmentList courseId={courseId} role={role} />
    </div>
  );
};

export default AssignmentsPage;
