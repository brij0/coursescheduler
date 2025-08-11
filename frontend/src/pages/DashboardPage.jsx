import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  Cpu,
  Database,
  Network,
  RefreshCw,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Server,
  Globe,
  Timer,
} from 'lucide-react';
import Navbar from '../components/Navbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Enhanced Chart.js defaults
ChartJS.defaults.font.family = "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
ChartJS.defaults.color = '#475569';
ChartJS.defaults.plugins.legend.labels.boxWidth = 12;
ChartJS.defaults.plugins.legend.labels.boxHeight = 12;

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Enhanced Card component with status indicators
const Card = ({ title, subtitle, icon: Icon, actions, children, status, trend }) => (
  <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
    {(title || actions) && (
      <div className="flex items-start justify-between p-5 border-b border-gray-50">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                status === 'error' ? 'bg-red-50 text-red-600' :
                status === 'warning' ? 'bg-amber-50 text-amber-600' :
                status === 'success' ? 'bg-green-50 text-green-600' :
                'bg-gray-50 text-gray-700'
              }`}>
                <Icon size={18} />
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {trend && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    trend > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                  }`}>
                    {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

// Status Badge component
const StatusBadge = ({ status, children }) => {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {children}
    </span>
  );
};

// Metric Card component for KPIs
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, status = 'info', format = 'number' }) => {
  const formatValue = (val) => {
    if (val == null) return 'N/A';
    switch (format) {
      case 'percentage': return `${val.toFixed(1)}%`;
      case 'ms': return `${Math.round(val)}ms`;
      case 'seconds': return `${val.toFixed(2)}s`;
      case 'number': return new Intl.NumberFormat('en-US').format(val);
      default: return val;
    }
  };

  return (
    <Card icon={Icon} status={status}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatValue(value)}</span>
            {trend && (
              <span className={`flex items-center text-sm font-medium ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200/80 rounded-md ${className}`} />
);

// Enhanced chart options
const getChartOptions = (type = 'default') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    elements: {
      bar: { borderRadius: 8, borderSkipped: false },
      point: { radius: 3, hoverRadius: 6, borderWidth: 2 },
      line: { tension: 0.4, borderWidth: 3 },
    },
    plugins: {
      legend: { 
        position: 'top', 
        labels: { 
          usePointStyle: true, 
          padding: 20,
          font: { size: 12, weight: '500' }
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e5e7eb',
        padding: 16,
        cornerRadius: 12,
        displayColors: true,
        borderColor: 'rgba(156, 163, 175, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  if (type === 'area') {
    return {
      ...baseOptions,
      elements: {
        ...baseOptions.elements,
        line: { ...baseOptions.elements.line, fill: true },
      },
    };
  }

  return baseOptions;
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch consolidated metrics from your new precomputed endpoint
  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/metrics/`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setMetrics(data.data);
      setLastUpdated(new Date(data.created_at)); // Use created_at from the API response
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Helper functions for data processing
  const getSystemHealth = () => {
    if (!metrics) return 'unknown';
    const successRate = metrics.success_rate || 0;
    const avgResponseTime = (metrics.avg_response_time || 0) * 1000;
    
    if (successRate >= 99 && avgResponseTime < 200) return 'excellent';
    if (successRate >= 97 && avgResponseTime < 500) return 'good';
    if (successRate >= 95 && avgResponseTime < 1000) return 'warning';
    return 'critical';
  };

  const getTopSlowAPIs = () => {
    if (!metrics?.slowest_apis) return [];
    return Object.entries(metrics.slowest_apis)
      .sort((a, b) => b[1].avg_duration - a[1].avg_duration)
      .slice(0, 6);
  };

  const getTopErrorAPIs = () => {
    if (!metrics?.error_rates) return [];
    return Object.entries(metrics.error_rates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto pt-32 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto pt-32 p-6">
          <Card
            title="Dashboard Error"
            subtitle="Unable to load metrics data"
            icon={AlertTriangle}
            status="error"
            actions={
              <button
                onClick={fetchMetrics}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            }
          >
            <div className="text-sm text-red-600 font-medium">{error.message}</div>
          </Card>
        </div>
      </div>
    );
  }

  const systemHealth = getSystemHealth();
  const topSlowAPIs = getTopSlowAPIs();
  const topErrorAPIs = getTopErrorAPIs();

  // Chart data preparation
  const requestVolumeData = {
    labels: (metrics?.hourly_volume || []).map(item => 
      new Date(item.hour).toLocaleTimeString([], { hour: 'numeric', hour12: true })
    ),
    datasets: [{
      label: 'Requests',
      data: (metrics?.hourly_volume || []).map(item => item.request_count),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
    }],
  };

  const apiPerformanceData = {
    labels: topSlowAPIs.map(([name]) => name.split(':').pop() || name),
    datasets: [{
      label: 'Avg Response Time (s)',
      data: topSlowAPIs.map(([, data]) => data.avg_duration),
      backgroundColor: topSlowAPIs.map((_, i) => 
        `hsla(${220 - i * 20}, 70%, 60%, 0.8)`
      ),
    }],
  };

  const errorDistributionData = {
    labels: Object.keys(metrics?.error_distribution || {}),
    datasets: [{
      data: Object.values(metrics?.error_distribution || {}),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(248, 113, 113, 0.8)',
        'rgba(252, 165, 165, 0.8)',
      ],
    }],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto pt-32 p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Real-time system metrics and performance insights</span>
              {lastUpdated && (
                <span className="flex items-center gap-1">
                  <Activity size={14} />
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <StatusBadge status={
              systemHealth === 'excellent' ? 'success' :
              systemHealth === 'good' ? 'success' :
              systemHealth === 'warning' ? 'warning' : 'error'
            }>
              {systemHealth === 'excellent' && <CheckCircle size={14} />}
              {systemHealth === 'good' && <CheckCircle size={14} />}
              {systemHealth === 'warning' && <AlertCircle size={14} />}
              {systemHealth === 'critical' && <AlertTriangle size={14} />}
              System {systemHealth}
            </StatusBadge>
            <button
              onClick={fetchMetrics}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Success Rate"
              value={metrics?.success_rate}
              subtitle="Percentage of successful requests"
              icon={CheckCircle}
              format="percentage"
              status={metrics?.success_rate >= 99 ? 'success' : metrics?.success_rate >= 95 ? 'warning' : 'error'}
            />
            <MetricCard
              title="Avg Response Time"
              value={metrics?.avg_response_time * 1000}
              subtitle="Average across all endpoints"
              icon={Timer}
              format="ms"
              status={metrics?.avg_response_time < 0.2 ? 'success' : metrics?.avg_response_time < 0.5 ? 'warning' : 'error'}
            />
            <MetricCard
              title="P95 Latency"
              value={metrics?.p95_latency * 1000}
              subtitle="95th percentile response time"
              icon={Clock}
              format="ms"
              status={metrics?.p95_latency < 0.3 ? 'success' : metrics?.p95_latency < 0.5 ? 'warning' : 'error'}
            />
            <MetricCard
              title="Total Requests (24h)"
              value={metrics?.total_requests_24h}
              subtitle="Requests in last 24 hours"
              icon={Activity}
              format="number"
            />
          </div>
        </section>

                {/* User Metrics */}
                <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
              title="Daily Active Sessions"
              value={metrics?.das}
              subtitle="Sessions active today"
              icon={Clock}
              format="number"
            />
                        <MetricCard
              title="Daily Active Users"
              value={metrics?.dau}
              subtitle="Unique users today"
              icon={Users}
              format="number"
            />

            <MetricCard
              title="Weekly Active Users"
              value={metrics?.wau}
              subtitle="Unique users this week"
              icon={Users}
              format="number"
            />
            <MetricCard
              title="Monthly Active Users"
              value={metrics?.mau}
              subtitle="Unique users this month"
              icon={Users}
              format="number"
            />
            <MetricCard
              title="Avg Sessions/User"
              value={metrics?.average_sessions_per_user}
              subtitle="Average sessions per user"
              icon={Globe}
              format="number"
            />

          </div>
        </section>

        {/* Traffic and Performance Analysis */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic & Performance Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Request Volume Trend"
              subtitle="Hourly request volume over the last 24 hours"
              icon={TrendingUp}
            >
              <div style={{ height: 300 }}>
                <Line
                  data={requestVolumeData}
                  options={{
                    ...getChartOptions('area'),
                    scales: {
                      ...getChartOptions().scales,
                      y: {
                        ...getChartOptions().scales.y,
                        title: { display: true, text: 'Requests per Hour' },
                      },
                    },
                  }}
                />
              </div>
            </Card>

            <Card
              title="API Performance"
              subtitle="Average response time for slowest endpoints"
              icon={Zap}
            >
              <div style={{ height: 300 }}>
                {topSlowAPIs.length > 0 ? (
                  <Bar
                    data={apiPerformanceData}
                    options={{
                      ...getChartOptions(),
                      indexAxis: 'y',
                      scales: {
                        x: {
                          ...getChartOptions().scales.x,
                          title: { display: true, text: 'Response Time (seconds)' },
                        },
                        y: { 
                          ...getChartOptions().scales.y, 
                          grid: { display: false },
                        },
                      },
                      plugins: {
                        ...getChartOptions().plugins,
                        tooltip: {
                          ...getChartOptions().plugins.tooltip,
                          callbacks: {
                            label: (ctx) => ` ${ctx.parsed.x.toFixed(3)}s`,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No performance data available
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Error Analysis and System Health */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Analysis & System Health</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card
              title="Error Distribution"
              subtitle="Breakdown of error types"
              icon={AlertTriangle}
            >
              <div style={{ height: 250 }}>
                {Object.keys(metrics?.error_distribution || {}).length > 0 ? (
                  <Doughnut
                    data={errorDistributionData}
                    options={{
                      ...getChartOptions(),
                      cutout: '60%',
                      plugins: {
                        ...getChartOptions().plugins,
                        legend: { position: 'bottom' },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No errors detected
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Top Error Endpoints"
              subtitle="Endpoints with highest error counts"
              icon={AlertCircle}
            >
              <div className="space-y-3">
                {topErrorAPIs.length > 0 ? topErrorAPIs.map(([endpoint, count], i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-sm font-medium text-red-900 truncate">
                      {endpoint.split(' - ')[0].split(':').pop()}
                    </span>
                    <StatusBadge status="error">{count} errors</StatusBadge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="mx-auto mb-2" size={24} />
                    No errors detected
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Peak Traffic Hours"
              subtitle="Highest traffic periods"
              icon={Activity}
            >
              <div className="space-y-3">
                {(metrics?.peak_hours || []).map((peak, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        {new Date(peak.hour).toLocaleString([], { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric',
                          hour12: true 
                        })}
                      </div>
                    </div>
                    <StatusBadge status="info">{peak.request_count} requests</StatusBadge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* System Overview */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Infrastructure Status" subtitle="Current system status" icon={Server}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Endpoints</span>
                  <StatusBadge status="success">{metrics?.total_endpoints || 0}</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <StatusBadge status="info">{metrics?.total_users || 0}</StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <StatusBadge status={metrics?.success_rate >= 95 ? 'success' : 'warning'}>
                    {(metrics?.success_rate || 0).toFixed(1)}%
                  </StatusBadge>
                </div>
              </div>
            </Card>

            <Card title="Performance Insights" subtitle="System performance summary" icon={Zap}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fastest API</span>
                  <span className="font-semibold text-green-600">
                    {Object.entries(metrics?.api_performance || {})
                      .sort((a, b) => a[1].avg_duration - b[1].avg_duration)[0]?.[0]?.split(':').pop() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slowest API</span>
                  <span className="font-semibold text-red-600">
                    {topSlowAPIs[0]?.[0]?.split(':').pop() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P99 Latency</span>
                  <span className="font-semibold">
                    {Math.round((metrics?.p99_latency || 0) * 1000)}ms
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Traffic Summary" subtitle="Request volume insights" icon={Network}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Requests</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-US').format(metrics?.total_requests_24h || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">7d Requests</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-US').format(metrics?.total_requests_7d || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">30d Requests</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('en-US').format(metrics?.total_requests_30d || 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;