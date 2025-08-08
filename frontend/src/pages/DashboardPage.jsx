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
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Cpu,
  Database,
  Network,
  RefreshCw,
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
  Legend
);

// Set professional-looking Chart.js defaults
ChartJS.defaults.font.family =
  "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
ChartJS.defaults.color = '#475569'; // slate-600
ChartJS.defaults.plugins.legend.labels.boxWidth = 12;
ChartJS.defaults.plugins.legend.labels.boxHeight = 12;

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Reusable UI primitives
const Card = ({ title, subtitle, icon: Icon, actions, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    {(title || actions) && (
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-700">
                <Icon size={18} />
              </span>
            ) : null}
            <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          </div>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200/80 rounded-md ${className}`} />
);

const numberFmt = new Intl.NumberFormat('en-US');
const pctFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const msFmt = (ms) => (ms == null ? 'N/A' : `${Math.round(ms)}ms`);
const sFmt = (s) => (s == null ? 'N/A' : `${s.toFixed(2)}s`);

const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  elements: {
    bar: { borderRadius: 6, borderSkipped: false },
    point: { radius: 2, hoverRadius: 4 },
    line: { tension: 0.35, borderWidth: 2 },
  },
  plugins: {
    legend: { position: 'top', labels: { usePointStyle: true } },
    tooltip: {
      backgroundColor: '#111827',
      titleColor: '#fff',
      bodyColor: '#e5e7eb',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
      ticks: { color: '#64748b' },
    },
  },
};

const Dashboard = () => {
  // State variables for different metrics
  const [errorRates, setErrorRates] = useState([]);
  const [p95Latency, setP95Latency] = useState(null);
  const [requestVolume, setRequestVolume] = useState([]);
  const [apiUsage, setApiUsage] = useState([]);
  const [averageEndpointTime, setAverageEndpointTime] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [mauDau, setMauDau] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        errorRatesResponse,
        p95LatencyResponse,
        requestVolumeResponse,
        apiUsageResponse,
        averageEndpointTimeResponse,
        userStatsResponse,
        mauDauResponse,
      ] = await Promise.all([
        fetch(`${BACKEND_API_URL}/api/metrics/error_rates/`),
        fetch(`${BACKEND_API_URL}/api/metrics/latency/p95_p99/`),
        fetch(`${BACKEND_API_URL}/api/metrics/request_volume/`),
        fetch(`${BACKEND_API_URL}/api/metrics/api_usage_patterns/`),
        fetch(`${BACKEND_API_URL}/api/metrics/average_time_per_endpoint/`),
        fetch(`${BACKEND_API_URL}/api/metrics/estimate_user_year_stats/`),
        fetch(`${BACKEND_API_URL}/api/metrics/mau_dau/`),
      ]);

      if (!errorRatesResponse.ok) throw new Error(`Error rates: ${errorRatesResponse.status}`);
      if (!p95LatencyResponse.ok) throw new Error(`Latency: ${p95LatencyResponse.status}`);
      if (!requestVolumeResponse.ok) throw new Error(`Request volume: ${requestVolumeResponse.status}`);
      if (!apiUsageResponse.ok) throw new Error(`API usage: ${apiUsageResponse.status}`);
      if (!averageEndpointTimeResponse.ok) throw new Error(`Avg time: ${averageEndpointTimeResponse.status}`);
      if (!userStatsResponse.ok) throw new Error(`User stats: ${userStatsResponse.status}`);
      if (!mauDauResponse.ok) throw new Error(`MAU/DAU: ${mauDauResponse.status}`);

      const [
        errorRatesData,
        p95LatencyData,
        requestVolumeData,
        apiUsageData,
        averageEndpointTimeData,
        userStatsData,
        mauDauData,
      ] = await Promise.all([
        errorRatesResponse.json(),
        p95LatencyResponse.json(),
        requestVolumeResponse.json(),
        apiUsageResponse.json(),
        averageEndpointTimeResponse.json(),
        userStatsResponse.json(),
        mauDauResponse.json(),
      ]);

      setErrorRates(errorRatesData || []);
      setP95Latency(p95LatencyData || null);
      setRequestVolume(requestVolumeData || []);
      setApiUsage(apiUsageData || []);
      setAverageEndpointTime(averageEndpointTimeData || []);
      setUserStats(userStatsData || {});
      setMauDau(mauDauData || {});
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart data
  const errorRatesChartData = {
    labels: errorRates.map((item) => (item.path || '').replace('/api/', '')),
    datasets: [
      {
        label: 'Error Rate (%)',
        data: errorRates.map((item) => item.error_rate),
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: 'rgba(239, 68, 68, 1)',
      },
    ],
  };

  const requestVolumeChartData = {
    labels: requestVolume.map((item) =>
      item.hour ? new Date(item.hour).toLocaleTimeString([], { hour: '2-digit' }) : ''
    ),
    datasets: [
      {
        label: 'Requests per Hour',
        data: requestVolume.map((item) => item.request_count),
        fill: true,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
      },
    ],
  };

  const apiUsageChartData = {
    labels: apiUsage.slice(0, 8).map((item) => (item.api_name || '').replace('/api/', '')),
    datasets: [
      {
        label: 'Request Count',
        data: apiUsage.slice(0, 8).map((item) => item.request_count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(245, 101, 101, 0.85)',
          'rgba(251, 191, 36, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(236, 72, 153, 0.85)',
          'rgba(6, 182, 212, 0.85)',
          'rgba(132, 204, 22, 0.85)',
        ],
      },
    ],
  };

  const averageTimeChartData = {
    labels: averageEndpointTime.slice(0, 6).map((item) => (item.path || '').replace('/api/', '')),
    datasets: [
      {
        label: 'Avg Response Time (s)',
        data: averageEndpointTime.slice(0, 6).map((item) => item.average_duration),
        backgroundColor: 'rgba(168, 85, 247, 0.85)',
        borderColor: 'rgba(168, 85, 247, 1)',
      },
    ],
  };

  const schoolDistributionChartData = userStats.school_counts
    ? {
        labels: userStats.school_counts.map((s) => s.school || 'Unknown'),
        datasets: [
          {
            data: userStats.school_counts.map((s) => s.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.85)',
              'rgba(16, 185, 129, 0.85)',
              'rgba(245, 101, 101, 0.85)',
              'rgba(251, 191, 36, 0.85)',
              'rgba(139, 92, 246, 0.85)',
            ],
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[340px]" />
            <Skeleton className="h-[340px]" />
            <Skeleton className="h-[340px]" />
            <Skeleton className="h-[340px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <Card
            title="Dashboard Error"
            subtitle="We couldn’t load metrics. Please try again."
            icon={AlertTriangle}
            actions={
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
              >
                <RefreshCw size={16} />
                Retry
              </button>
            }
          >
            <div className="text-sm text-red-600">{String(error.message || error)}</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Metrics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              System health, usage, and performance at a glance.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
            title="Refresh data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Key Metrics */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card title="Monthly Active Users" icon={Users}>
              <div className="text-3xl font-bold text-gray-900">{numberFmt.format(mauDau.MAU || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">Unique users in current month</p>
            </Card>
            <Card title="Daily Active Users" icon={Users}>
              <div className="text-3xl font-bold text-gray-900">{numberFmt.format(mauDau.DAU || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">Unique users yesterday</p>
            </Card>
            <Card title="P95 Latency" icon={Clock}>
              <div className="text-3xl font-bold text-gray-900">
                {msFmt((p95Latency?.p95_latency || 0) * 1000)}
              </div>
              <p className="text-xs text-gray-500 mt-1">95th percentile across all endpoints</p>
            </Card>
            <Card title="Total Users" icon={TrendingUp}>
              <div className="text-3xl font-bold text-gray-900">
                {numberFmt.format(userStats.overall_stats?.total_users || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">From EstimateUserYear</p>
            </Card>
          </div>
        </section>

        {/* Core Performance & Reliability */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Error Rates by API Endpoint"
              subtitle="Endpoints with the highest error percentage"
              icon={AlertTriangle}
            >
              <div style={{ height: 320 }}>
                {errorRates.length ? (
                  <Bar
                    data={errorRatesChartData}
                    options={{
                      ...commonChartOptions,
                      scales: {
                        ...commonChartOptions.scales,
                        y: {
                          ...commonChartOptions.scales.y,
                          title: { display: true, text: 'Error Rate (%)' },
                          ticks: {
                            ...commonChartOptions.scales.y.ticks,
                            callback: (v) => `${v}%`,
                          },
                        },
                      },
                      plugins: {
                        ...commonChartOptions.plugins,
                        tooltip: {
                          ...commonChartOptions.plugins.tooltip,
                          callbacks: {
                            label: (ctx) => ` ${pctFmt.format(ctx.parsed.y)}%`,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No error data available
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Request Volume (Last 24h)"
              subtitle="Requests aggregated by hour"
              icon={TrendingUp}
            >
              <div style={{ height: 320 }}>
                {requestVolume.length ? (
                  <Line
                    data={requestVolumeChartData}
                    options={{
                      ...commonChartOptions,
                      scales: {
                        ...commonChartOptions.scales,
                        y: {
                          ...commonChartOptions.scales.y,
                          title: { display: true, text: 'Requests per Hour' },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No request volume data available
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* API Performance */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="API Usage Patterns (Top 8)"
              subtitle="Most frequently used endpoints"
              icon={Network}
            >
              <div style={{ height: 320 }}>
                {apiUsage.length ? (
                  <Bar
                    data={apiUsageChartData}
                    options={{
                      ...commonChartOptions,
                      indexAxis: 'y',
                      scales: {
                        x: {
                          ...commonChartOptions.scales.x,
                          title: { display: true, text: 'Request Count' },
                        },
                        y: { ...commonChartOptions.scales.y, grid: { display: false } },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No API usage data available
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Average Response Time per Endpoint"
              subtitle="Top endpoints by average latency"
              icon={Clock}
            >
              <div style={{ height: 320 }}>
                {averageEndpointTime.length ? (
                  <Bar
                    data={averageTimeChartData}
                    options={{
                      ...commonChartOptions,
                      scales: {
                        ...commonChartOptions.scales,
                        y: {
                          ...commonChartOptions.scales.y,
                          title: { display: true, text: 'Response Time (seconds)' },
                        },
                      },
                      plugins: {
                        ...commonChartOptions.plugins,
                        tooltip: {
                          ...commonChartOptions.plugins.tooltip,
                          callbacks: {
                            label: (ctx) => ` ${sFmt(ctx.parsed.y)}`,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No response time data available
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* User Behavior & Demographics */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="School Distribution"
              subtitle="User distribution by school"
              icon={Users}
            >
              <div style={{ height: 320 }}>
                {schoolDistributionChartData ? (
                  <Doughnut
                    data={schoolDistributionChartData}
                    options={{
                      ...commonChartOptions,
                      cutout: '62%',
                      plugins: {
                        ...commonChartOptions.plugins,
                        legend: { position: 'right' },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No school distribution data available
                  </div>
                )}
              </div>
            </Card>

            <Card title="Performance Summary" subtitle="Key latency and usage insights" icon={Clock}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">P95 Latency</span>
                  <span className="font-semibold">
                    {msFmt((p95Latency?.p95_latency || 0) * 1000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P99 Latency</span>
                  <span className="font-semibold">
                    {msFmt((p95Latency?.p99_latency || 0) * 1000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Year</span>
                  <span className="font-semibold">
                    {userStats.overall_stats?.average_year
                      ? Number(userStats.overall_stats.average_year).toFixed(1)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracked Endpoints</span>
                  <span className="font-semibold">{averageEndpointTime.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Infrastructure Metrics (Placeholder) */}
        <section className="mb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="CPU Utilization" subtitle="Data from external monitoring system" icon={Cpu}>
              <p className="text-sm text-gray-500">Integrate with Prometheus/Grafana.</p>
            </Card>
            <Card title="Database Performance" subtitle="Data from external monitoring system" icon={Database}>
              <p className="text-sm text-gray-500">Add slow query rate, connections, locks.</p>
            </Card>
            <Card title="Network Traffic" subtitle="Data from external monitoring system" icon={Network}>
              <p className="text-sm text-gray-500">Ingress/egress, error rate by gateway.</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;