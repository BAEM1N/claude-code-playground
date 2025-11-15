import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { competitionAPI } from '../services/api';
import {
  Competition,
  CompetitionType,
  EvaluationMetric,
  CompetitionStatistics,
} from '../types/competition';
import './CompetitionsPage.css';

const CompetitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [statistics, setStatistics] = useState<CompetitionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('active');
  const [typeFilter, setTypeFilter] = useState<CompetitionType | 'all'>('all');

  useEffect(() => {
    loadCompetitions();
    loadStatistics();
  }, [filter, typeFilter]);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (filter === 'active') params.is_active = true;
      if (typeFilter !== 'all') params.competition_type = typeFilter;

      const { data } = await competitionAPI.getCompetitions(params);

      // Filter by time if needed
      let filteredCompetitions = data;
      const now = new Date();

      if (filter === 'upcoming') {
        filteredCompetitions = data.filter((c: Competition) =>
          new Date(c.start_date) > now
        );
      } else if (filter === 'past') {
        filteredCompetitions = data.filter((c: Competition) =>
          new Date(c.end_date) < now
        );
      }

      setCompetitions(filteredCompetitions);
    } catch (error) {
      console.error('Failed to load competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const { data } = await competitionAPI.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const getCompetitionStatus = (competition: Competition) => {
    const now = new Date();
    const start = new Date(competition.start_date);
    const end = new Date(competition.end_date);

    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  return (
    <div className="competitions-page">
      <div className="competitions-header">
        <div className="header-content">
          <h1>Competitions</h1>
          <p>Participate in Kaggle-style machine learning competitions</p>
        </div>

        {statistics && (
          <div className="statistics-cards">
            <div className="stat-card">
              <div className="stat-value">{statistics.active_competitions}</div>
              <div className="stat-label">Active Competitions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.total_participants}</div>
              <div className="stat-label">Total Participants</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.total_submissions}</div>
              <div className="stat-label">Submissions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.total_teams}</div>
              <div className="stat-label">Teams</div>
            </div>
          </div>
        )}
      </div>

      <div className="competitions-content">
        <div className="filters-bar">
          <div className="filter-group">
            <label>Status:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
              <option value="all">All Types</option>
              <option value={CompetitionType.INDIVIDUAL}>Individual</option>
              <option value={CompetitionType.TEAM}>Team</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading competitions...</div>
        ) : competitions.length === 0 ? (
          <div className="no-competitions">
            <p>No competitions found</p>
          </div>
        ) : (
          <div className="competitions-grid">
            {competitions.map((competition) => {
              const status = getCompetitionStatus(competition);
              return (
                <div
                  key={competition.id}
                  className={`competition-card ${status}`}
                  onClick={() => navigate(`/competitions/${competition.id}`)}
                >
                  <div className="competition-header">
                    <h3>{competition.title}</h3>
                    <span className={`status-badge ${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <p className="competition-description">
                    {competition.description || 'No description available'}
                  </p>

                  <div className="competition-meta">
                    <div className="meta-item">
                      <span className="meta-label">Type:</span>
                      <span className="meta-value">
                        {competition.competition_type === CompetitionType.INDIVIDUAL
                          ? 'Individual'
                          : 'Team'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Metric:</span>
                      <span className="meta-value">
                        {getMetricLabel(competition.evaluation_metric)}
                      </span>
                    </div>
                  </div>

                  <div className="competition-dates">
                    <div className="date-item">
                      <span className="date-label">Start:</span>
                      <span>{formatDate(competition.start_date)}</span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">End:</span>
                      <span>{formatDate(competition.end_date)}</span>
                    </div>
                  </div>

                  <div className="competition-stats">
                    <div className="stat-item">
                      <span className="stat-icon">👥</span>
                      <span>{competition.participant_count} participants</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📊</span>
                      <span>{competition.submission_count} submissions</span>
                    </div>
                  </div>

                  {competition.prize_description && (
                    <div className="competition-prize">
                      <span className="prize-icon">🏆</span>
                      <span>{competition.prize_description}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsPage;
