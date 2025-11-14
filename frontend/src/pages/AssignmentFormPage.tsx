/**
// @ts-nocheck
 * Assignment Form Page (Create/Edit)
// @ts-nocheck
 */
// @ts-nocheck
import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentForm from '../components/assignments/AssignmentForm';
import { useAssignment } from '../hooks/useAssignments';

const AssignmentFormPage: React.FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId?: string }>();
  const { data: assignment, isLoading: loading } = useAssignment(assignmentId || '');

  if (assignmentId && loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <AssignmentForm
        courseId={courseId}
        assignmentId={assignmentId}
        initialData={assignment}
      />
    </div>
  );
};

export default AssignmentFormPage;
