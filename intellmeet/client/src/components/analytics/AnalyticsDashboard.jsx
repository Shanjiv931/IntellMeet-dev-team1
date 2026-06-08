import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './AnalyticsDashboard.css';

// Custom SVG Area Chart for chronological meetings count
function AreaChart({ data }) {
  const width = 600;
  const height = 240;
  const paddingTop = 20;
  const paddingBottom = 40;
  const paddingLeft = 40;
  const paddingRight = 20;

  const maxVal = Math.max(...data.map(d => d.count), 3); // Minimum Y scale

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * (width - paddingLeft - paddingRight);
    const y = height - paddingBottom - (d.count / maxVal) * (height - paddingTop - paddingBottom);
    return { x, y, ...d };
  });

  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach(p => {
      pathD += ` L ${p.x} ${p.y}`;
    });
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="svg-chart-wrapper" style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary, #2563eb)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary, #2563eb)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3].map((g, idx) => {
          const yVal = paddingTop + (idx / 3) * (height - paddingTop - paddingBottom);
          const gridLabel = Math.round(maxVal - (idx / 3) * maxVal);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={yVal}
                x2={width - paddingRight}
                y2={yVal}
                className="chart-grid-line"
                stroke="var(--border-color, rgba(255,255,255,0.08))"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={yVal + 4}
                className="chart-axis-label"
                fill="var(--text-muted, #94a3b8)"
                fontSize="10"
                textAnchor="end"
              >
                {gridLabel}
              </text>
            </g>
          );
        })}

        {/* X Axis labels (show every 5 days to prevent clutter) */}
        {points.map((p, idx) => {
          if (idx % 5 === 0 || idx === points.length - 1) {
            return (
              <text
                key={idx}
                x={p.x}
                y={height - paddingBottom + 20}
                className="chart-axis-label"
                fill="var(--text-muted, #94a3b8)"
                fontSize="10"
                textAnchor="middle"
              >
                {p.label}
              </text>
            );
          }
          return null;
        })}

        {/* Shaded Area */}
        {areaD && <path d={areaD} fill="url(#chart-area-grad)" />}

        {/* Glowing Path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary, #2563eb)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Nodes */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint?.date === p.date ? 6 : 3}
            fill={hoveredPoint?.date === p.date ? "var(--primary, #2563eb)" : "white"}
            stroke="var(--primary, #2563eb)"
            strokeWidth={hoveredPoint?.date === p.date ? 3 : 1.5}
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          />
        ))}
      </svg>
      {hoveredPoint && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 55}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <strong>{hoveredPoint.label}</strong>
          <div>Meetings: {hoveredPoint.count}</div>
          {hoveredPoint.count > 0 && <div>Avg Duration: {hoveredPoint.avgDuration} min</div>}
        </div>
      )}
    </div>
  );
}

// Custom SVG Bar Chart for Kanban Task status distribution
function BarChart({ data }) {
  const width = 450;
  const height = 240;
  const paddingTop = 20;
  const paddingBottom = 40;
  const paddingLeft = 40;
  const paddingRight = 20;

  const maxVal = Math.max(...data.map(d => d.count), 3);

  const colors = {
    TODO: '#94a3b8',
    IN_PROGRESS: '#3b82f6',
    REVIEW: '#eab308',
    DONE: '#10b981'
  };

  const statusLabels = {
    TODO: 'Todo',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'In Review',
    DONE: 'Completed'
  };

  const barWidth = 36;
  const chartWidth = width - paddingLeft - paddingRight;
  const numBars = data.length;

  return (
    <div className="svg-chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Grid lines */}
        {[0, 1, 2, 3].map((g, idx) => {
          const yVal = paddingTop + (idx / 3) * (height - paddingTop - paddingBottom);
          const gridLabel = Math.round(maxVal - (idx / 3) * maxVal);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={yVal}
                x2={width - paddingRight}
                y2={yVal}
                className="chart-grid-line"
                stroke="var(--border-color, rgba(255,255,255,0.08))"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={yVal + 4}
                className="chart-axis-label"
                fill="var(--text-muted, #94a3b8)"
                fontSize="10"
                textAnchor="end"
              >
                {gridLabel}
              </text>
            </g>
          );
        })}

        {/* Bars mapping */}
        {data.map((item, idx) => {
          const x = paddingLeft + (idx / (numBars - 1 || 1)) * (chartWidth - barWidth * 1.5) + barWidth / 2;
          const barHeight = (item.count / maxVal) * (height - paddingTop - paddingBottom);
          const y = height - paddingBottom - barHeight;
          const color = colors[item.status] || 'var(--primary, #2563eb)';
          const label = statusLabels[item.status] || item.status;

          return (
            <g key={idx} className="chart-bar-group">
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx="4"
                fill={color}
                opacity="0.85"
                className="chart-bar"
                style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              />
              <text
                x={x}
                y={y - 8}
                fill="var(--text-main, #0f172a)"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
              >
                {item.count}
              </text>
              <text
                x={x}
                y={height - paddingBottom + 20}
                className="chart-axis-label"
                fill="var(--text-muted, #94a3b8)"
                fontSize="10"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Circular Productivity Gauge
function RadialGauge({ value }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="radial-gauge-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary, #2563eb)" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color, rgba(255,255,255,0.08))"
          strokeWidth={strokeWidth}
          opacity="0.15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          fill="var(--text-main, #0f172a)"
          fontSize="24"
          fontWeight="800"
          dy=".3em"
        >
          {value}%
        </text>
      </svg>
    </div>
  );
}

export default function AnalyticsDashboard({ user, setCurrentTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics');
      if (res.success && res.data) {
        setAnalytics(res.data);
      } else {
        setError('Failed to fetch user analytics');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Error compiling database analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content container">
        <div className="analytics-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="analytics-metrics-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div className="analytics-card skeleton-card" key={i}>
              <div className="skeleton-icon"></div>
              <div className="skeleton-label"></div>
              <div className="skeleton-value"></div>
            </div>
          ))}
        </div>
        <div className="analytics-layout-grid">
          <div className="analytics-card skeleton-chart-card">
            <div className="skeleton-chart-title"></div>
            <div className="skeleton-chart-body"></div>
          </div>
          <div className="analytics-card skeleton-chart-card">
            <div className="skeleton-chart-title"></div>
            <div className="skeleton-chart-body"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content container">
        <div className="analytics-error-state">
          <div className="error-icon">⚠️</div>
          <h3>Failed to Load Analytics</h3>
          <p>{error}</p>
          <button className="btn-join" onClick={fetchAnalytics}>🔄 Retry Load</button>
        </div>
      </div>
    );
  }

  const { overview, trends, productivity, insights } = analytics;

  // Check if everything is completely empty (new account state)
  const isFreshAccount = 
    overview.totalMeetings === 0 && 
    overview.totalTasks === 0 && 
    overview.completedTasks === 0 &&
    overview.aiSummaries === 0;

  if (isFreshAccount) {
    return (
      <div className="dashboard-content container">
        <div className="analytics-welcome-header">
          <h1>📊 Performance Insights</h1>
          <p>Optimize your focus and track team delivery metrics over time.</p>
        </div>

        <div className="analytics-empty-state-view">
          <div className="empty-state-visual">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 20V10M12 20V4M6 20V14" stroke="var(--primary, #2563eb)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>No Analytical Insights Compiled Yet</h2>
          <p>Schedule your first meeting or create workspace tasks to initiate your personal productivity analytics dashboard.</p>
          <div className="empty-state-ctas">
            <button className="btn-join" onClick={() => setCurrentTab('meetings')}>
              📅 Schedule Call
            </button>
            <button className="btn-join btn-secondary" onClick={() => setCurrentTab('workspace')}>
              👥 Go to Kanban Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generate continuous timeline array for chronological SVG rendering
  const timelineData = (() => {
    const rawTrends = trends.meetingsTrend || [];
    const trendMap = {};
    rawTrends.forEach(item => {
      trendMap[item._id] = item;
    });

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const labelStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      if (trendMap[dateStr]) {
        result.push({
          date: dateStr,
          label: labelStr,
          count: trendMap[dateStr].count,
          avgDuration: Math.round(trendMap[dateStr].avgDuration)
        });
      } else {
        result.push({
          date: dateStr,
          label: labelStr,
          count: 0,
          avgDuration: 0
        });
      }
    }
    return result;
  })();

  return (
    <div className="dashboard-content container animate-fade-in">
      <div className="analytics-welcome-header">
        <h1>📊 Performance Insights</h1>
        <p>Optimize your focus and track team delivery metrics over time.</p>
      </div>

      {/* Overview Metric Cards */}
      <div className="analytics-metrics-grid">
        <div className="analytics-card metric-card hover-glow">
          <div className="metric-icon blue-bg">🎥</div>
          <div className="metric-info">
            <span className="metric-label">Total Meetings</span>
            <span className="metric-value">{overview.totalMeetings}</span>
          </div>
        </div>

        <div className="analytics-card metric-card hover-glow">
          <div className="metric-icon violet-bg">⏱️</div>
          <div className="metric-info">
            <span className="metric-label">Meeting Hours</span>
            <span className="metric-value">{overview.totalHours}h</span>
          </div>
        </div>

        <div className="analytics-card metric-card hover-glow">
          <div className="metric-icon amber-bg">📋</div>
          <div className="metric-info">
            <span className="metric-label">Total Tasks</span>
            <span className="metric-value">{overview.totalTasks}</span>
          </div>
        </div>

        <div className="analytics-card metric-card hover-glow">
          <div className="metric-icon emerald-bg">✅</div>
          <div className="metric-info">
            <span className="metric-label">Tasks Completed</span>
            <span className="metric-value">{overview.completedTasks}</span>
          </div>
        </div>

        <div className="analytics-card metric-card hover-glow">
          <div className="metric-icon indigo-bg">🤖</div>
          <div className="metric-info">
            <span className="metric-label">AI Summaries</span>
            <span className="metric-value">{overview.aiSummaries}</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Block */}
      <div className="analytics-layout-grid">
        {/* Meetings Trend */}
        <div className="analytics-card chart-card">
          <div className="chart-header">
            <h3>Meetings Timeline</h3>
            <span className="chart-subtitle">Last 30 Days</span>
          </div>
          <div className="chart-body">
            <AreaChart data={timelineData} />
          </div>
        </div>

        {/* Tasks Breakdown */}
        <div className="analytics-card chart-card">
          <div className="chart-header">
            <h3>Task Status Breakdown</h3>
            <span className="chart-subtitle">Workspace Distribution</span>
          </div>
          <div className="chart-body">
            <BarChart data={trends.taskStatusDistribution || []} />
          </div>
        </div>
      </div>

      {/* Productivity & AI Insights */}
      <div className="analytics-layout-grid two-thirds">
        {/* Productivity Dial and Checklist */}
        <div className="analytics-card productivity-insight-card">
          <div className="chart-header">
            <h3>Productivity Index</h3>
            <span className="chart-subtitle">Overall score evaluation</span>
          </div>
          <div className="productivity-gauge-box">
            <RadialGauge value={insights.productivityScore} />
            <div className="productivity-stat-list">
              <div className="stat-row">
                <span className="dot blue-dot"></span>
                <span className="stat-label">Task Completion Rate</span>
                <span className="stat-value">{productivity.taskCompletionRate}%</span>
              </div>
              <div className="stat-row">
                <span className="dot emerald-dot"></span>
                <span className="stat-label">Action Item Completion</span>
                <span className="stat-value">
                  {productivity.actionItemsCreated > 0 
                    ? Math.round((productivity.actionItemsCompleted / productivity.actionItemsCreated) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="stat-row">
                <span className="dot violet-dot"></span>
                <span className="stat-label">Average Session Duration</span>
                <span className="stat-value">{productivity.avgMeetingDuration} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Topics and Active insights */}
        <div className="analytics-card ai-insights-card">
          <div className="chart-header">
            <h3>AI Analytics & Insights</h3>
            <span className="chart-subtitle">Key conversation keywords & speaking metrics</span>
          </div>
          
          <div className="insights-panels">
            <div className="insight-badge-row">
              <div className="badge-item">
                <span className="badge-title">Most Active Day</span>
                <span className="badge-value">{insights.mostActiveDay}</span>
              </div>
              <div className="badge-item">
                <span className="badge-title">Speaking Time</span>
                <span className="badge-value">{insights.avgSpeakingTime}</span>
              </div>
            </div>

            <div className="topics-freq-section">
              <h4>Top Discussed Topics</h4>
              {insights.topTopics.length === 0 ? (
                <div className="topics-empty-text">No topic keywords indexed from transcripts yet.</div>
              ) : (
                <div className="topics-tag-cloud">
                  {insights.topTopics.map((item, idx) => (
                    <div className="topic-tag" key={idx}>
                      <span className="topic-text">{item.topic}</span>
                      <span className="topic-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
