import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  Activity,
  Zap,
  Server,
  Target,
  AlertCircle,
  Eye,
  Calculator, // <-- ADD THIS ICON for GPA Calculator
  CalendarDays, // <-- ADD THIS ICON for Scheduler
  MessageSquare, // <-- ADD THIS ICON for Co-op Forum
  Globe, // <-- ADD THIS ICON for other/unknown
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import Navbar from "../components/Navbar"; // Assuming Navbar component is robust
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  LabelList, // <-- Ensure LabelList is imported
} from "recharts";

import api from "../contexts/API"; // Assuming API context is robust

// Color schemes
const COLORS = {
  primary: "#456882",
  secondary: "#8EB1C7",
  tertiary: "#BFD4DE",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#0284C7",
  gray: "#6B7280",
};
const ERROR_COLORS = ["#DC2626", "#D97706", "#456882", "#6B7280", "#8EB1C7"]; // Added one more color

// Define specific colors for common error types for consistent display
// Re-emphasizing specific colors for status codes
const SPECIFIC_ERROR_COLORS_PIE = {
  "5xx": "#DC2626", // Critical Red
  403: "#D97706", // Warning Amber
  404: "#456882", // Primary Blue for Not Found
  401: "#8EB1C7", // A lighter blue for other 401s if they appear (not the ignored one)
  default: "#6B7280", // Gray for any other unexpected codes
};

// Custom tooltip for charts - MODIFIED to show multiple values
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}:{" "}
            <span className="font-bold">
              {new Intl.NumberFormat("en-US").format(entry.value)}
              {unit}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
const AppActivityCard = ({ title, requests, icon: Icon, color }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center transition-all duration-200 hover:shadow-xl`}
    >
      <div className={`p-3 rounded-full inline-flex mb-3 ${color}`}>
        <Icon size={28} className="text-white" />
      </div>
      <div className="text-xl font-bold text-gray-900 mb-1">
        {new Intl.NumberFormat("en-US").format(requests)}
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
};
//  Summary Card
const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = "neutral",
  unit = "",
}) => {
  const formatValue = (val) => {
    if (val == null || isNaN(val)) return "N/A";  // This line is fine
    if (typeof val === "number" && val > 1000) {   // This is the problem!
      return new Intl.NumberFormat("en-US").format(val) + unit;
    }
    return val + unit;  // Success rates will hit this line
  };

  const statusColors = {
    excellent: "border-green-200 bg-gradient-to-br from-green-50 to-green-100",
    good: "border-green-200 bg-gradient-to-br from-green-50 to-green-100",
    warning: "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100",
    critical: "border-red-200 bg-gradient-to-br from-red-50 to-red-100",
    neutral: "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100",
  };

  const iconColors = {
    excellent: "text-green-600",
    good: "text-green-600",
    warning: "text-amber-600",
    critical: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div
      className={`rounded-xl p-6 border-2 ${statusColors[status]} transition-all duration-200 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`p-2 rounded-lg bg-white shadow-sm ${iconColors[status]}`}
            >
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {title}
              </h3>
              {trend && (
                <div className="flex items-center gap-1 mt-1">
                  {trend > 0 ? (
                    <ArrowUpRight size={14} className="text-green-600" />
                  ) : (
                    <ArrowDownRight size={14} className="text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${trend > 0 ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </span>
          </div>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// Performance metric card
const PerformanceCard = ({ title, value, format, status, subtitle }) => {
  const formatValue = (val, fmt) => {
    if (val == null || isNaN(val)) return "N/A";
    switch (fmt) {
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "ms":
        return `${Math.round(val)}ms`;
      case "seconds":
        return `${val.toFixed(2)}s`;
      default:
        return new Intl.NumberFormat("en-US").format(val);
    }
  };

  const statusConfig = {
    excellent: { bg: "bg-blue-500", text: "text-white" },
    good: { bg: "bg-green-500", text: "text-white" },
    warning: { bg: "bg-amber-500", text: "text-white" },
    critical: { bg: "bg-red-500", text: "text-white" },
    neutral: { bg: "bg-gray-500", text: "text-white" },
  };
  const config = statusConfig[status] || statusConfig.neutral;

  return (
    <div className={`${config.bg} ${config.text} rounded-xl p-6 shadow-lg`}>
      <div className="text-center">
        <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
        <div className="text-4xl font-bold mb-2">
          {formatValue(value, format)}
        </div>
        {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
      </div>
    </div>
  );
};

// Chart component with proper error handling
const ChartContainer = ({ title, children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

// API Health component
const ApiHealthGrid = ({ apis = {} }) => {
  // Sort by request count descending, then slice to top 8
  const sortedApis = Object.entries(apis)
    .sort(([, a], [, b]) => b.request_count - a.request_count)
    .slice(0, 8);

  if (sortedApis.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No API data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sortedApis.map(([apiName, data]) => {
        const responseTime = data.avg_duration * 1000;
        const status =
          responseTime < 200
            ? "good"
            : responseTime < 500
              ? "warning"
              : "critical";

        const statusColors = {
          good: "border-green-200 bg-green-50",
          warning: "border-amber-200 bg-amber-50",
          critical: "border-red-200 bg-red-50",
        };

        const dotColors = {
          good: "bg-green-500",
          warning: "bg-amber-500",
          critical: "bg-red-500",
        };

        // Improved display name extraction
        const displayName = apiName.includes(":")
          ? apiName.split(":")[1]
          : apiName;

        return (
          <div
            key={apiName}
            className={`p-4 rounded-lg border ${statusColors[status]} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${dotColors[status]}`}
                  />
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {displayName}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {new Intl.NumberFormat("en-US").format(data.request_count)}{" "}
                  requests
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {Math.round(responseTime)}ms
                </div>
                <div className="text-xs text-gray-600">avg</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullResponse, setFullResponse] = useState({});
  const getMetricValue = (path, defaultValue = 0) => {
    return (
      path.split(".").reduce((obj, key) => obj?.[key], metrics) ?? defaultValue
    );
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await api.fetchMetrics();
        setFullResponse(response); // Store the full response
        setMetrics(response.data || {}); // Access the 'data' property for metrics
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch metrics");
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            System Unavailable
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Handle case where metrics might be null after loading,
  // especially if API returns an empty 'data' object or similar
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <p className="text-gray-600">No system data available</p>
        </div>
      </div>
    );
  }

  // Calculate "true" total errors, excluding specific "auth-api:user - 401" errors
  let totalRequestsToday = Object.values(metrics.api_performance || {}).reduce(
    (sum, api) => sum + (api.request_count || 0),
    0
  );
  let ignoredAuthErrors = 0;

  if (metrics.error_rates && metrics.error_rates["auth-api:user - 401"]) {
    ignoredAuthErrors = metrics.error_rates["auth-api:user - 401"];
  }

  const trueTotalErrors = Object.entries(metrics.error_rates || {}).reduce(
    (sum, [key, count]) => {
      if (key === "auth-api:user - 401") {
        return sum;
      }
      return sum + (count || 0);
    },
    0
  );

  // The number of requests that are "actual" successful requests + actual errors
  const relevantRequests = Math.max(0, totalRequestsToday - ignoredAuthErrors);
  const successCount = Math.max(0, relevantRequests - trueTotalErrors);
  const trueSuccessRate =
    relevantRequests > 0 ? (successCount / relevantRequests) * 100 : 100; // If no relevant requests, assume 100% success
  const displaySuccessRate =
    relevantRequests > 0
      ? Math.min(100, Math.max(0, (successCount / relevantRequests) * 100))
      : 100;
  // Traffic volume chart data
  const trafficData = (metrics.hourly_volume || []).map((item) => ({
    time: new Date(item.hour).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    requests: item.request_count,
  }));

  // Top APIs by response time - MODIFIED to use `slowest_apis` from provided JSON
  const slowestApisData = Object.entries(metrics.slowest_apis || {})
    .sort(([, a], [, b]) => b.avg_duration - a.avg_duration)
    .slice(0, 6) // Display top 6 slowest APIs
    .map(([name, data]) => ({
      name: name.includes(":") ? name.split(":")[1] : name, // Extract meaningful part of API name
      responseTime: Math.round(data.avg_duration * 1000), // Convert to ms and round
      requests: data.request_count,
    }));

  // --- START OF NEW ERROR_DATA LOGIC ---
  const errorData = (() => {
    const aggregatedErrors = {};

    Object.entries(metrics.error_rates || {}).forEach(([key, count]) => {
      // Skip the specific auth error
      if (key === "auth-api:user - 401") {
        return;
      }

      // Ensure count is a valid number
      const errorCount = Number(count) || 0;
      if (errorCount <= 0) return;

      // Extract HTTP status code with improved regex
      const statusMatch = key.match(/\b([45]\d{2})\b/);
      if (statusMatch) {
        const code = statusMatch[1];
        aggregatedErrors[code] = (aggregatedErrors[code] || 0) + errorCount;
      } else {
        // Handle edge cases
        if (key.toLowerCase().includes("404")) {
          aggregatedErrors["404"] = (aggregatedErrors["404"] || 0) + errorCount;
        } else if (key.toLowerCase().includes("403")) {
          aggregatedErrors["403"] = (aggregatedErrors["403"] || 0) + errorCount;
        } else if (key.toLowerCase().includes("500")) {
          aggregatedErrors["500"] = (aggregatedErrors["500"] || 0) + errorCount;
        } else {
          // Group other errors as "Other"
          aggregatedErrors["Other"] =
            (aggregatedErrors["Other"] || 0) + errorCount;
        }
      }
    });

    // Convert to chart format
    const chartData = Object.entries(aggregatedErrors)
      .map(([code, count]) => {
        let color;
        if (code.startsWith("5")) {
          color = SPECIFIC_ERROR_COLORS_PIE["5xx"];
        } else if (code === "403") {
          color = SPECIFIC_ERROR_COLORS_PIE["403"];
        } else if (code === "404") {
          color = SPECIFIC_ERROR_COLORS_PIE["404"];
        } else if (code === "401") {
          color = SPECIFIC_ERROR_COLORS_PIE["401"];
        } else {
          color = SPECIFIC_ERROR_COLORS_PIE.default;
        }

        return {
          name: code === "Other" ? "Other" : `HTTP ${code}`,
          value: count,
          color: color,
        };
      })
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);

    return chartData;
  })();
  // --- END OF NEW ERROR_DATA LOGIC ---

  // System health status (now uses `trueSuccessRate`)
  const avgResponseMs = (metrics.avg_response_time || 0) * 1000;
  const systemHealth =
    trueSuccessRate >= 99
      ? "excellent"
      : trueSuccessRate >= 95
        ? "good"
        : trueSuccessRate >= 90
          ? "warning"
          : "critical";

  const responseHealth =
    avgResponseMs < 150
      ? "excellent"
      : avgResponseMs < 300
        ? "good"
        : avgResponseMs < 500
          ? "warning"
          : "critical";

  const getMostPopularApps = (apiPerformanceData) => {
    const appRequests = {
      "GPA Calculator": { count: 0, icon: Calculator, color: "bg-indigo-500" },
      "Scheduler App": { count: 0, icon: CalendarDays, color: "bg-teal-500" },
      "Co-op Forum App": {
        count: 0,
        icon: MessageSquare,
        color: "bg-pink-500",
      },
      "Auth System": { count: 0, icon: Shield, color: "bg-blue-500" },
      "Metrics API": { count: 0, icon: BarChart3, color: "bg-orange-500" },
      "Other/Unknown": { count: 0, icon: Globe, color: "bg-gray-500" }, // Catch-all for other APIs
    };

    if (!apiPerformanceData) {
      return Object.values(appRequests); // Return default with 0 counts
    }

    Object.entries(apiPerformanceData).forEach(([apiName, data]) => {
      const requestCount = data.request_count || 0;
      if (apiName.includes("gpacalc-api")) {
        appRequests["GPA Calculator"].count += requestCount;
      } else if (apiName.includes("scheduler-api")) {
        appRequests["Scheduler App"].count += requestCount;
      } else if (apiName.includes("coopforum-api")) {
        appRequests["Co-op Forum App"].count += requestCount;
      } else if (apiName.includes("auth-api")) {
        appRequests["Auth System"].count += requestCount;
      } else if (apiName.includes("metrics-api")) {
        appRequests["Metrics API"].count += requestCount;
      } else {
        appRequests["Other/Unknown"].count += requestCount;
      }
    });

    // Sort the apps by request count in descending order
    return Object.entries(appRequests)
      .map(([name, data]) => ({
        name,
        requests: data.count,
        icon: data.icon,
        color: data.color,
      }))
      .sort((a, b) => b.requests - a.requests)
      .filter((app) => app.requests > 0); // Only show apps with activity
  };
  const popularAppsData = getMostPopularApps(metrics.api_performance);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6 pt-28 space-y-8">
        {/* Header */}
        <div className="text-center py-4">
          {" "}
          {/* Reduced vertical padding */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">
            System Performance & Business Intelligence
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <CheckCircle size={16} className="text-green-500" />
            <span>Last updated: {fullResponse.created_at ? new Date(fullResponse.created_at).toLocaleString() : "N/A"}</span>
          </div>
        </div>

        {/*  KPIs */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Active Users Today"
              value={metrics.dau || 0}
              subtitle="Daily active users"
              icon={Users}
              status="good"
            />
            <SummaryCard
              title="System Uptime"
              value={trueSuccessRate.toFixed(1)} // Remove the % and toFixed for proper formatting
              unit="%" // Add the unit here instead
              subtitle="Request success rate"
              icon={CheckCircle}
              status={systemHealth}
            />
            <SummaryCard
              title="Response Performance"
              value={Math.round(avgResponseMs)} // Pass as a number
              unit="ms" // Add a unit prop
              subtitle="Average response time"
              icon={Zap}
              status={responseHealth}
            />
            <SummaryCard
              title="Request Volume"
              value={totalRequestsToday} // This still reflects all requests
              subtitle="Total requests"
              icon={Activity}
              status="neutral"
            />
          </div>
        </section>

        {/* Performance Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Performance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PerformanceCard
              title="P95 Latency"
              value={(metrics.p95_latency || 0) * 1000}
              format="ms"
              status={
                (metrics.p95_latency || 0) * 1000 < 300
                  ? "good"
                  : (metrics.p95_latency || 0) * 1000 < 500
                    ? "warning"
                    : "critical"
              }
              subtitle="95th percentile"
            />
            <PerformanceCard
              title="P99 Latency"
              value={(metrics.p99_latency || 0) * 1000}
              format="ms"
              status={
                (metrics.p99_latency || 0) * 1000 < 500
                  ? "good"
                  : (metrics.p99_latency || 0) * 1000 < 1000
                    ? "warning"
                    : "critical"
              }
              subtitle="99th percentile"
            />
            <PerformanceCard
              title="Error Rate"
              value={100 - trueSuccessRate} // Use trueSuccessRate
              format="percentage"
              status={
                100 - trueSuccessRate < 1
                  ? "good"
                  : 100 - trueSuccessRate < 5
                    ? "warning"
                    : "critical"
              }
              subtitle="Total failed requests"
            />
            <PerformanceCard
              title="Endpoints"
              value={metrics.total_endpoints || 0}
              status="neutral"
              subtitle="Active API endpoints"
            />
          </div>
        </section>

        {/* Traffic & Performance Analysis */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Traffic & Performance Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Volume Chart */}
            <ChartContainer title="Request Volume Trend">
              {trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={trafficData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="requestsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#456882"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#456882"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12, fill: COLORS.gray }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      interval="preserveStartEnd" // Adjusts tick interval for better readability
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: COLORS.gray }}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip content={<CustomTooltip unit=" requests" />} />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#456882"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#requestsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity
                      size={48}
                      className="text-gray-300 mx-auto mb-2"
                    />
                    <p>No traffic data available yet</p>
                  </div>
                </div>
              )}
            </ChartContainer>

            {/* Slowest API Endpoints - MODIFIED TOOLTIP AND LEGEND */}
            <ChartContainer title="Slowest API Endpoints">
              {slowestApisData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={slowestApisData}
                    layout="vertical" // Changed to vertical layout for API names
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: COLORS.gray }}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: COLORS.gray }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      width={130} // Increased width for longer labels
                      tickFormatter={(value) =>
                        value.length > 25
                          ? `${value.substring(0, 22)}...`
                          : value
                      }
                    />
                    <Tooltip
                      // Custom Tooltip for Bar Chart - MODIFIED to show both responseTime and requests
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const apiName = label;
                          const responseTime = payload[0].value;
                          const requests = slowestApisData.find(
                            (api) => api.name === apiName
                          )?.requests;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                              <p className="font-semibold text-gray-800 mb-1">
                                {apiName}
                              </p>
                              <p style={{ color: COLORS.primary }}>
                                Response Time:{" "}
                                <span className="font-bold">
                                  {responseTime}ms
                                </span>
                              </p>
                              {requests != null && (
                                <p style={{ color: COLORS.gray }}>
                                  Requests:{" "}
                                  <span className="font-bold">
                                    {new Intl.NumberFormat("en-US").format(
                                      requests
                                    )}
                                  </span>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="responseTime"
                      name="Avg. Response Time (ms)"
                      // Disable the default active color on hover
                      activeBar={false} // Prevents default hover effect on the bar itself
                    >
                      {slowestApisData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.responseTime > 500
                              ? ERROR_COLORS[0] // Critical: Red
                              : entry.responseTime > 200
                                ? ERROR_COLORS[1] // Warning: Amber
                                : COLORS.primary // Good: Primary blue
                          }
                        />
                      ))}
                      {/* ADD LabelList to display values on bars */}
                      <LabelList
                        dataKey="responseTime"
                        position="right" // Position the label to the right of the bar
                        formatter={(value) => `${value}ms`} // Format the label text
                        fill="#000" // Color of the label text
                        fontSize={12}
                        offset={5} // Offset from the end of the bar
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity
                      size={48}
                      className="text-gray-300 mx-auto mb-2"
                    />
                    <p>No performance data available yet</p>
                  </div>
                </div>
              )}
            </ChartContainer>
          </div>
        </section>

        {/* API Health & Errors */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            API Health & Error Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Health Status */}
            <div className="lg:col-span-2">
              <ChartContainer title="API Endpoint Health">
                {/* Ensure `metrics.api_performance` is used for the grid, as `most_popular_apis` might be sorted differently. */}
                <ApiHealthGrid apis={metrics.api_performance || {}} />
              </ChartContainer>
            </div>

            {/* Error Distribution */}
            <ChartContainer title="Error Distribution">
              {errorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name" // Ensure nameKey is set for legend
                      // ADD LabelList to display values on slices
                      label={({ name, value }) =>
                        `${name}: ${new Intl.NumberFormat("en-US").format(
                          value
                        )}`
                      } // Label format
                      labelLine={false} // Hide the line connecting label to slice
                    >
                      {errorData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color} // Use the color directly from the data entry
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      align="center" // Center the legend
                      wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} // Added padding for better spacing
                      layout="horizontal" // Ensure horizontal layout if too many items
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <CheckCircle
                      size={48}
                      className="text-green-500 mx-auto mb-2"
                    />
                    <p>No errors detected</p>
                  </div>
                </div>
              )}
            </ChartContainer>
          </div>
        </section>

        {/* User Engagement */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            User Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metrics.dau || 0}
              </div>
              <div className="text-sm text-gray-600">Daily Active Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metrics.wau || 0}
              </div>
              <div className="text-sm text-gray-600">Weekly Active Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
              <Eye className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metrics.mau || 0}
              </div>
              <div className="text-sm text-gray-600">Monthly Active Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
              <Activity className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metrics.average_sessions_per_user?.toFixed(1) || "0.0"}
              </div>
              <div className="text-sm text-gray-600">Avg Sessions per User</div>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Most Popular Applications
          </h2>
          {popularAppsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularAppsData.map((app) => (
                <AppActivityCard
                  key={app.name}
                  title={app.name}
                  requests={app.requests}
                  icon={app.icon}
                  color={app.color}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center text-gray-500 h-40 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="text-gray-300 mx-auto mb-2" />
                <p>No application activity data available.</p>
              </div>
            </div>
          )}
        </section>

        {/* System Security */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Security & Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Added proper background and text color to match the design pattern of PerformanceCard */}
            <div className="bg-red-500 text-white rounded-xl p-6 text-center shadow-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
              <div className="text-2xl font-bold mb-1">
                {metrics.error_rates?.["auth-api:user - 401"] || 0}
              </div>{" "}
              {/* This specific 401 is *not* excluded here, as it's a security/auth metric */}
              <div className="text-sm opacity-90">Auth Failures (401)</div>
            </div>
            <div className="bg-amber-500 text-white rounded-xl p-6 text-center shadow-lg">
              <Shield className="h-8 w-8 mx-auto mb-3" />
              <div className="text-2xl font-bold mb-1">
                {Object.entries(metrics.error_rates || {})
                  .filter(([key]) => key.includes("403"))
                  .reduce((sum, [, count]) => sum + count, 0)}
              </div>
              <div className="text-sm opacity-90">Access Denied (403)</div>
            </div>
            <div className="bg-red-600 text-white rounded-xl p-6 text-center shadow-lg">
              <Server className="h-8 w-8 mx-auto mb-3" />
              <div className="text-2xl font-bold mb-1">
                {Object.entries(metrics.error_rates || {})
                  .filter(([code]) => code.includes("500")) // Filter for '500' errors
                  .reduce((sum, [, count]) => sum + count, 0)}
              </div>
              <div className="text-sm opacity-90">Server Errors (5xx)</div>
            </div>
            <div className="bg-gray-500 text-white rounded-xl p-6 text-center shadow-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-3" />
              <div className="text-2xl font-bold mb-1">
                {Object.entries(metrics.error_rates || {})
                  .filter(([key]) => key.includes("404"))
                  .reduce((sum, [, count]) => sum + count, 0)}
              </div>
              <div className="text-sm opacity-90">Not Found (404)</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;