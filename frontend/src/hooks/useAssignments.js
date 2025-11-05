/**
 * Custom hooks for assignments
 */
import { useState, useEffect } from 'react';
import { assignmentsAPI } from '../services/api';

/**
 * Hook for fetching assignments
 */
export const useAssignments = (courseId, includeUnpublished = false) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        const { data } = await assignmentsAPI.getAssignments(courseId, {
          include_unpublished: includeUnpublished,
        });
        setAssignments(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId, includeUnpublished]);

  return { assignments, loading, error, refetch: () => {} };
};

/**
 * Hook for fetching single assignment
 */
export const useAssignment = (assignmentId) => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);
        const { data } = await assignmentsAPI.getAssignment(assignmentId);
        setAssignment(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  return { assignment, loading, error };
};

/**
 * Hook for fetching assignment statistics
 */
export const useAssignmentStats = (assignmentId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);
        const { data } = await assignmentsAPI.getAssignmentStats(assignmentId);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [assignmentId]);

  return { stats, loading, error };
};

/**
 * Hook for fetching student's submission
 */
export const useMySubmission = (assignmentId) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmission = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      const { data } = await assignmentsAPI.getMySubmission(assignmentId);
      setSubmission(data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setSubmission(null);
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [assignmentId]);

  return { submission, loading, error, refetch: fetchSubmission };
};

/**
 * Hook for fetching all submissions (instructor/assistant)
 */
export const useSubmissions = (assignmentId) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      const { data } = await assignmentsAPI.getSubmissions(assignmentId);
      setSubmissions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  return { submissions, loading, error, refetch: fetchSubmissions };
};
