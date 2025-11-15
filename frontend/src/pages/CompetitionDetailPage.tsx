import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionAPI } from '../services/api';
import {
  Competition,
  CompetitionType,
  EvaluationMetric,
  CompetitionLeaderboardEntry,
  CompetitionSubmission,
  SubmissionStatus,
} from '../types/competition';
import './CompetitionDetailPage.css';

type TabType = 'overview' | 'leaderboard' | 'submissions' | 'data' | 'rules';

const CompetitionDetailPage: React.FC = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<CompetitionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadCompetition();
    }
  }, [competitionId]);

  useEffect(() => {
    if (activeTab === 'leaderboard' && competitionId) {
      loadLeaderboard();
    } else if (activeTab === 'submissions' && competitionId) {
      loadSubmissions();
    }
  }, [activeTab, competitionId]);

  const loadCompetition = async () => {
    try {
      setLoading(true);
      const { data } = await competitionAPI.getCompetition(parseInt(competitionId!));
      setCompetition(data);
      // Check if user has joined (you can add a field in the backend response)
      setHasJoined(data.has_joined || false);
    } catch (error) {
      console.error('Failed to load competition:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data } = await competitionAPI.getLeaderboard(parseInt(competitionId!), 'public');
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data } = await competitionAPI.getMySubmissions(parseInt(competitionId!));
      setSubmissions(data.submissions || data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleJoinCompetition = async () => {
    try {
      await competitionAPI.joinCompetition(parseInt(competitionId!));
      setHasJoined(true);
      loadCompetition();
    } catch (error) {
      console.error('Failed to join competition:', error);
      alert('Failed to join competition. Please try again.');
    }
  };

  const handleFileSubmit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSubmitting(true);
      await competitionAPI.submitSolution(parseInt(competitionId!), file);
      alert('Submission uploaded successfully! Processing...');
      loadSubmissions();
    } catch (error: any) {
      console.error('Failed to submit:', error);
      alert(error.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleDownloadData = async (type: 'train' | 'test' | 'sample') => {
    try {
      let response;
      if (type === 'train') {
        response = await competitionAPI.downloadTrainData(parseInt(competitionId!));
      } else if (type === 'test') {
        response = await competitionAPI.downloadTestData(parseInt(competitionId!));
      } else {
        response = await competitionAPI.downloadSampleSubmission(parseInt(competitionId!));
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_data.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download data:', error);
      alert('Failed to download data. Please try again.');
    }
  };

  const getMetricLabel = (metric: EvaluationMetric) => {
    const labels: Record<EvaluationMetric, string> = {
      [EvaluationMetric.ACCURACY]: 'Accuracy',
      [EvaluationMetric.F1_SCORE]: 'F1 Score',
      [EvaluationMetric.RMSE]: 'RMSE',
      [EvaluationMetric.MAE]: 'MAE',
      [EvaluationMetric.AUC]: 'AUC-ROC',
      [EvaluationMetric.LOG_LOSS]: 'Log Loss',
    };
    return labels[metric];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.COMPLETED:
        return 'green';
      case SubmissionStatus.PROCESSING:
        return 'blue';
      case SubmissionStatus.FAILED:
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return <div className="loading">Loading competition...</div>;
  }

  if (!competition) {
    return <div className="error">Competition not found</div>;
  }

  const now = new Date();
  const isActive = new Date(competition.start_date) <= now && new Date(competition.end_date) >= now;
  const hasEnded = new Date(competition.end_date) < now;

  return (
    <div className="competition-detail-page">
      <div className="competition-header">
        <button className="back-button" onClick={() => navigate('/competitions')}>
          ← Back to Competitions
        </button>

        <div className="header-content">
          <h1>{competition.title}</h1>
          <div className="header-meta">
            <span className="meta-badge">
              {competition.competition_type === CompetitionType.INDIVIDUAL ? 'Individual' : 'Team'}
            </span>
            <span className="meta-badge">{getMetricLabel(competition.evaluation_metric)}</span>
            <span className={`status-badge ${hasEnded ? 'ended' : isActive ? 'active' : 'upcoming'}`}>
              {hasEnded ? 'Ended' : isActive ? 'Active' : 'Upcoming'}
            </span>
          </div>
        </div>

        {!hasJoined && isActive && (
          <button className="join-button" onClick={handleJoinCompetition}>
            Join Competition
          </button>
        )}
      </div>

      <div className="competition-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`tab ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          My Submissions
        </button>
        <button
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
      </div>

      <div className="competition-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="competition-info">
              <section className="info-section">
                <h2>Description</h2>
                <p>{competition.description || 'No description available'}</p>
              </section>

              <section className="info-section">
                <h2>Competition Details</h2>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      {competition.competition_type === CompetitionType.INDIVIDUAL
                        ? 'Individual'
                        : 'Team Competition'}
                    </span>
                  </div>
                  {competition.competition_type === CompetitionType.TEAM && (
                    <div className="detail-item">
                      <span className="detail-label">Max Team Size:</span>
                      <span className="detail-value">{competition.max_team_size} members</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Evaluation Metric:</span>
                    <span className="detail-value">{getMetricLabel(competition.evaluation_metric)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submission Limit:</span>
                    <span className="detail-value">{competition.max_submissions_per_day} per day</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Start Date:</span>
                    <span className="detail-value">{formatDate(competition.start_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">{formatDate(competition.end_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Public Test:</span>
                    <span className="detail-value">{competition.public_test_percentage}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Private Test:</span>
                    <span className="detail-value">{100 - competition.public_test_percentage}%</span>
                  </div>
                </div>
              </section>

              {competition.prize_description && (
                <section className="info-section prize-section">
                  <h2>🏆 Prize</h2>
                  <p>{competition.prize_description}</p>
                </section>
              )}

              <section className="info-section">
                <h2>Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-value">{competition.participant_count}</div>
                    <div className="stat-label">Participants</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{competition.submission_count}</div>
                    <div className="stat-label">Total Submissions</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-tab">
            <h2>Public Leaderboard</h2>
            <p className="leaderboard-note">
              This leaderboard is based on {competition.public_test_percentage}% of the test data.
              Final rankings will be determined by the remaining {100 - competition.public_test_percentage}%
              after the competition ends.
            </p>

            {leaderboard.length === 0 ? (
              <p className="no-data">No submissions yet</p>
            ) : (
              <div className="leaderboard-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Participant</th>
                      <th>Score</th>
                      <th>Submissions</th>
                      <th>Last Submission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.participant_id || entry.team_id}>
                        <td className="rank-cell">
                          {entry.rank_public && entry.rank_public <= 3 && (
                            <span className="medal">
                              {entry.rank_public === 1 ? '🥇' : entry.rank_public === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                          #{entry.rank_public}
                        </td>
                        <td>{entry.team_name || entry.user_email}</td>
                        <td className="score-cell">{entry.best_public_score.toFixed(4)}</td>
                        <td>{entry.submission_count}</td>
                        <td>{formatDate(entry.last_submission_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="submissions-tab">
            <div className="submissions-header">
              <h2>My Submissions</h2>
              {hasJoined && isActive && (
                <div className="submit-section">
                  <input
                    type="file"
                    id="submission-file"
                    accept=".csv"
                    onChange={handleFileSubmit}
                    disabled={submitting}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="submission-file" className={`submit-button ${submitting ? 'disabled' : ''}`}>
                    {submitting ? 'Uploading...' : 'Submit Prediction'}
                  </label>
                </div>
              )}
            </div>

            {!hasJoined ? (
              <p className="no-data">You need to join the competition to make submissions</p>
            ) : submissions.length === 0 ? (
              <p className="no-data">No submissions yet</p>
            ) : (
              <div className="submissions-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Submitted At</th>
                      <th>Public Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>{submission.submission_number}</td>
                        <td>{formatDate(submission.submitted_at)}</td>
                        <td>
                          {submission.public_score !== null && submission.public_score !== undefined
                            ? submission.public_score.toFixed(4)
                            : '-'}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          {submission.error_message && (
                            <div className="error-message">{submission.error_message}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-tab">
            <h2>Download Data</h2>
            <div className="data-downloads">
              <div className="download-card">
                <h3>Training Data</h3>
                <p>Download the training dataset with labels</p>
                <button onClick={() => handleDownloadData('train')}>Download train.csv</button>
              </div>
              <div className="download-card">
                <h3>Test Data</h3>
                <p>Download the test dataset (without labels)</p>
                <button onClick={() => handleDownloadData('test')}>Download test.csv</button>
              </div>
              {competition.sample_submission_path && (
                <div className="download-card">
                  <h3>Sample Submission</h3>
                  <p>Download a sample submission file format</p>
                  <button onClick={() => handleDownloadData('sample')}>Download sample.csv</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-tab">
            <h2>Competition Rules</h2>
            {competition.rules ? (
              <div className="rules-content">
                <pre>{competition.rules}</pre>
              </div>
            ) : (
              <p>No specific rules provided for this competition.</p>
            )}

            <section className="general-rules">
              <h3>General Guidelines</h3>
              <ul>
                <li>Maximum {competition.max_submissions_per_day} submissions per day</li>
                <li>Submissions are evaluated on {competition.public_test_percentage}% of test data (public leaderboard)</li>
                <li>Final rankings determined by remaining {100 - competition.public_test_percentage}% (private leaderboard)</li>
                {competition.competition_type === CompetitionType.TEAM && (
                  <li>Team size limited to {competition.max_team_size} members</li>
                )}
                <li>Submissions must be in CSV format</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionDetailPage;
