import React, { useState, useEffect } from 'react';
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

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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

  // Chart options
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // useEffect hooks to fetch data from backend APIs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const errorRatesResponse = await fetch(`${BACKEND_API_URL}/api/metrics/error_rates/`);
        if (!errorRatesResponse.ok) {
          throw new Error(`HTTP error! status: ${errorRatesResponse.status}`);
        }
        const errorRatesData = await errorRatesResponse.json();
        setErrorRates(errorRatesData);

        const p95LatencyResponse = await fetch(`${BACKEND_API_URL}/api/metrics/latency/p95_p99/`);
         if (!p95LatencyResponse.ok) {
          throw new Error(`HTTP error! status: ${p95LatencyResponse.status}`);
        }
        const p95LatencyData = await p95LatencyResponse.json();
        setP95Latency(p95LatencyData);

        const requestVolumeResponse = await fetch(`${BACKEND_API_URL}/api/metrics/request_volume/`);
         if (!requestVolumeResponse.ok) {
          throw new Error(`HTTP error! status: ${requestVolumeResponse.status}`);
        }
        const requestVolumeData = await requestVolumeResponse.json();
        setRequestVolume(requestVolumeData);

        const apiUsageResponse = await fetch(`${BACKEND_API_URL}/api/metrics/api_usage_patterns/`);
         if (!apiUsageResponse.ok) {
          throw new Error(`HTTP error! status: ${apiUsageResponse.status}`);
        }
        const apiUsageData = await apiUsageResponse.json();
        setApiUsage(apiUsageData);

        const averageEndpointTimeResponse = await fetch(`${BACKEND_API_URL}/api/metrics/average_time_per_endpoint/`);
         if (!averageEndpointTimeResponse.ok) {
          throw new Error(`HTTP error! status: ${averageEndpointTimeResponse.status}`);
        }
        const averageEndpointTimeData = await averageEndpointTimeResponse.json();
        setAverageEndpointTime(averageEndpointTimeData);

         const userStatsResponse = await fetch(`${BACKEND_API_URL}/api/metrics/estimate_user_year_stats/`);
          if (!userStatsResponse.ok) {
          throw new Error(`HTTP error! status: ${userStatsResponse.status}`);
        }
         const userStatsData = await userStatsResponse.json();
         setUserStats(userStatsData);

        const mauDauResponse = await fetch(`${BACKEND_API_URL}/api/metrics/mau_dau/`);
         if (!mauDauResponse.ok) {
          throw new Error(`HTTP error! status: ${mauDauResponse.status}`);
        }
        const mauDauData = await mauDauResponse.json();
        setMauDau(mauDauData);

      } catch (err) {
        setError(err);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Chart data preparation
  const errorRatesChartData = {
    labels: errorRates.map(item => item.path.replace('/api/', '')),
    datasets: [
      {
        label: 'Error Rate (%)',
        data: errorRates.map(item => item.error_rate),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const requestVolumeChartData = {
    labels: requestVolume.map(item => 
      new Date(item.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Requests per Hour',
        data: requestVolume.map(item => item.request_count),
        fill: false,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const apiUsageChartData = {
    labels: apiUsage.slice(0, 8).map(item => item.api_name.replace('/api/', '')),
    datasets: [
      {
        label: 'Request Count',
        data: apiUsage.slice(0, 8).map(item => item.request_count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(132, 204, 22, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const averageTimeChartData = {
    labels: averageEndpointTime.slice(0, 6).map(item => item.path.replace('/api/', '')),
    datasets: [
      {
        label: 'Average Response Time (seconds)',
        data: averageEndpointTime.slice(0, 6).map(item => item.average_duration),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  };

  const schoolDistributionChartData = userStats.school_counts ? {
    labels: userStats.school_counts.map(school => school.school),
    datasets: [
      {
        data: userStats.school_counts.map(school => school.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl font-bold">Loading Dashboard Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">
          Metrics Dashboard
        </h1>

        {/* Key Metrics Cards */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <Users className="text-blue-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Monthly Active Users</p>
                  <p className="text-2xl font-bold text-gray-800">{mauDau.MAU || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <Users className="text-green-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Daily Active Users</p>
                  <p className="text-2xl font-bold text-gray-800">{mauDau.DAU || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="text-orange-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">P95 Latency</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {p95Latency?.p95_latency ? `${(p95Latency.p95_latency * 1000).toFixed(0)}ms` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="text-purple-500 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {userStats.overall_stats?.total_users || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Performance & Reliability */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Core Performance &amp; Reliability
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Rates Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  Error Rates by API Endpoint
                </h3>
              </div>
              <div style={{ height: '300px' }}>
                {errorRates.length > 0 ? (
                  <Bar data={errorRatesChartData} options={{
                    ...commonChartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Error Rate (%)'
                        }
                      }
                    }
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No error data available
                  </div>
                )}
              </div>
            </div>

            {/* Request Volume Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  Request Volume Over Time (Last 24h)
                </h3>
              </div>
              <div style={{ height: '300px' }}>
                {requestVolume.length > 0 ? (
                  <Line data={requestVolumeChartData} options={{
                    ...commonChartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Requests per Hour'
                        }
                      }
                    }
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No request volume data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* API Performance */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            API Performance
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Usage Patterns */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Network className="text-purple-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  API Usage Patterns (Top 8)
                </h3>
              </div>
              <div style={{ height: '300px' }}>
                {apiUsage.length > 0 ? (
                  <Bar data={apiUsageChartData} options={{
                    ...commonChartOptions,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Request Count'
                        }
                      }
                    }
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No API usage data available
                  </div>
                )}
              </div>
            </div>

            {/* Average Response Time */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Clock className="text-teal-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  Average Response Time per Endpoint
                </h3>
              </div>
              <div style={{ height: '300px' }}>
                {averageEndpointTime.length > 0 ? (
                  <Bar data={averageTimeChartData} options={{
                    ...commonChartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Response Time (seconds)'
                        }
                      }
                    }
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No response time data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* User Behavior & Demographics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            User Behavior &amp; Demographics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* School Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Users className="text-indigo-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  School Distribution
                </h3>
              </div>
              <div style={{ height: '300px' }}>
                {schoolDistributionChartData ? (
                  <Doughnut data={schoolDistributionChartData} options={commonChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No school distribution data available
                  </div>
                )}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Clock className="text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  Performance Summary
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">P95 Latency:</span>
                  <span className="font-semibold">
                    {p95Latency?.p95_latency ? `${(p95Latency.p95_latency * 1000).toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P99 Latency:</span>
                  <span className="font-semibold">
                    {p95Latency?.p99_latency ? `${(p95Latency.p99_latency * 1000).toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Year:</span>
                  <span className="font-semibold">
                    {userStats.overall_stats?.average_year ? userStats.overall_stats.average_year.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Endpoints:</span>
                  <span className="font-semibold">{averageEndpointTime.length}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Metrics (Example) */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Infrastructure Metrics (Example)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-2">
                <Cpu className="text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  CPU Utilization
                </h3>
              </div>
              <p className="text-gray-600">Data from external monitoring system...</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-2">
                <Database className="text-purple-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  Database Performance
                </h3>
              </div>
              <p className="text-gray-600">Data from external monitoring system...</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-2">
                <Network className="text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-700">
                  Network Traffic
                </h3>
              </div>
              <p className="text-gray-600">Data from external monitoring system...</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;