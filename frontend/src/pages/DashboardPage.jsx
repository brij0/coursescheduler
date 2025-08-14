import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Server,
  Target,
  AlertCircle,
  Eye,
  LineChart as LineChartIcon, // Renamed to avoid conflict with Recharts LineChart
  Timer,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Import Recharts components
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
} from "recharts";

import api from "../contexts/API"; // Assuming this is correctly configured

// --- Recharts Chart Components ---
const COLORS_PIE_ERROR = ["#EF4444", "#F59E0B", "#10B981", "#6B7280"]; // Red, Amber, Green, Gray
const COLORS_API_HEALTH = ["#6366F1", "#A855F7", "#EC4899", "#F97316", "#FACC15", "#22C55E", "#0EA5E9"];

const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg text-sm">
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

const RenderLineChart = ({ title, data, dataKey, valueKey, className, yAxisUnit = "" }) => {
  // Check if data is empty or invalid
  if (!data || data.length === 0 || !data.some(d => d[valueKey] !== undefined && d[valueKey] !== null)) {
    return (
      <div className={`bg-gray-50 p-4 rounded-lg shadow-inner ${className} h-56 flex items-center justify-center text-gray-400 border border-dashed border-gray-300`}>
        No data for {title} chart.
      </div>
    );
  }

  // Determine tick interval for XAxis if data set is large
  const interval = data.length > 8 ? 'preserveStartEnd' : 0;

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border border-gray-100 ${className}`}>
      <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey={dataKey}
            tickFormatter={(value) => {
              if (dataKey === "hour" && typeof value === "string" && value.includes("T")) {
                return new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              }
              return value;
            }}
            interval={interval}
            angle={-30}
            textAnchor="end"
            height={50}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `${value}${yAxisUnit}`}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip unit={yAxisUnit} />} />
          <Line
            type="monotone"
            dataKey={valueKey}
            stroke="#6366F1"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const RenderBarChart = ({ title, data, dataKey, valueKey, className, yAxisUnit = "" }) => {
  // Check if data is empty or invalid
  if (!data || data.length === 0 || !data.some(d => d[valueKey] !== undefined && d[valueKey] !== null)) {
    return (
      <div className={`bg-gray-50 p-4 rounded-lg shadow-inner ${className} h-56 flex items-center justify-center text-gray-400 border border-dashed border-gray-300`}>
        No data for {title} chart.
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border border-gray-100 ${className}`}>
      <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout="vertical" // Use vertical layout for API names
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
          <YAxis
            dataKey={dataKey}
            type="category" // For names like API endpoints
            tick={{ fill: "#6B7280", fontSize: 12 }}
            width={100} // Adjust width to prevent labels from being cut off
          />
          <XAxis
            type="number"
            tickFormatter={(value) => `${value}${yAxisUnit}`}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip unit={yAxisUnit} />} />
          <Bar dataKey={valueKey} fill="#8884d8" name={title}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_API_HEALTH[index % COLORS_API_HEALTH.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


const RenderPieChart = ({ title, data, className }) => {
  // Check if data is empty or invalid
  if (!data || data.length === 0 || !data.some(d => d.value > 0)) {
    return (
      <div className={`bg-gray-50 p-4 rounded-lg shadow-inner ${className} h-56 flex items-center justify-center text-gray-400 border border-dashed border-gray-300`}>
        No data for {title} chart.
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border border-gray-100 ${className}`}>
      <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS_PIE_ERROR[index % COLORS_PIE_ERROR.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: "12px", marginLeft: "10px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
// --- End Recharts Chart Components ---

const Card = ({ title, children, className = "", icon: Icon }) => (
  <div
    className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-xl ${className}`}
  >
    {title && (
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Icon size={20} />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  status = "neutral",
  format = "number",
}) => {
  const formatValue = (val) => {
    if (val == null || isNaN(val)) return "N/A";
    switch (format) {
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "ms":
        return `${Math.round(val)}ms`;
      case "seconds":
        return `${val.toFixed(2)}s`;
      case "number":
        return new Intl.NumberFormat("en-US").format(val);
      case "requestsPerHour":
        return `${new Intl.NumberFormat("en-US").format(Math.round(val))}/hr`;
      default:
        return val;
    }
  };

  const statusColors = {
    critical: "border-red-300 bg-red-50 text-red-700",
    warning: "border-amber-300 bg-amber-50 text-amber-700",
    good: "border-green-300 bg-green-50 text-green-700",
    neutral: "border-gray-200 bg-white text-gray-700",
  };

  const iconColors = {
    critical: "text-red-600",
    warning: "text-amber-600",
    good: "text-green-600",
    neutral: "text-gray-600",
  };

  return (
    <div
      className={`rounded-xl p-6 shadow-md transition-all duration-200 ${statusColors[status]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={20} className={`${iconColors[status]}`} />
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </span>
            {/* Removed trend icon as we don't have historical data for it in the payload */}
          </div>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

const ApiHealthList = ({ apis }) => {
  if (!apis || Object.keys(apis).length === 0) {
    return <div className="text-gray-500 py-4">No API data available</div>;
  }

  const normalizedApis = groupApisByEndpoint(apis);

  const sortedApis = Object.entries(normalizedApis)
    .sort(([, a], [, b]) => b.request_count - a.request_count) // Sort by request count for 'most popular' list
    .slice(0, 7); // Show top 7 for brevity

  return (
    <div className="space-y-3">
      {sortedApis.map(([endpoint, data], index) => {
        const responseTime = data.avg_duration * 1000;
        const status =
          responseTime < 200 ? "good" : responseTime < 500 ? "warning" : "critical";

        const statusColor = {
          good: "bg-green-100 text-green-700",
          warning: "bg-amber-100 text-amber-700",
          critical: "bg-red-100 text-red-700",
        };

        const dotColor = {
          good: "bg-green-500",
          warning: "bg-amber-500",
          critical: "bg-red-500",
        };

        return (
          <div
            key={endpoint} // Use endpoint as key
            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${dotColor[status]}`} />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {endpoint}
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-4">
                {data.modules?.join(", ")} • {data.request_count} requests
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor[status]}`}
            >
              {Math.round(responseTime)}ms
            </div>
          </div>
        );
      })}
    </div>
  );
};

const normalizeApiName = (apiName) => {
  if (!apiName) return "";
  const parts = apiName.split(":");
  return parts.length > 1 ? parts[1] : apiName;
};

const groupApisByEndpoint = (apis) => {
  const groupedApis = {};

  Object.entries(apis || {}).forEach(([apiName, data]) => {
    const endpoint = normalizeApiName(apiName);

    if (!groupedApis[endpoint]) {
      groupedApis[endpoint] = {
        ...data,
        modules: [apiName.split(":")[0]],
        apiName, // Keep original apiName for reference if needed
      };
    } else {
      // Calculate new average duration
      const currentTotalDuration =
        groupedApis[endpoint].avg_duration * groupedApis[endpoint].request_count;
      const newTotalDuration = data.avg_duration * data.request_count;

      groupedApis[endpoint].request_count += data.request_count;
      groupedApis[endpoint].avg_duration =
        (currentTotalDuration + newTotalDuration) / groupedApis[endpoint].request_count;

      if (!groupedApis[endpoint].modules.includes(apiName.split(":")[0])) {
        groupedApis[endpoint].modules.push(apiName.split(":")[0]);
      }
    }
  });

  return groupedApis;
};

const filterNonAuthErrors = (errorRates) => {
  if (!errorRates) return {};
  return Object.entries(errorRates)
    .filter(([key]) => !key.includes("auth") && !key.includes("401") && !key.includes("403"))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
};

const ErrorAnalysis = ({ errorRates, errorDistribution, totalRequests }) => {
  if (!errorRates || !errorDistribution || !totalRequests) {
    return <div className="text-gray-500 py-4">No error data available</div>;
  }

  // Calculate success and error counts
  const totalErrors = Object.values(errorDistribution).reduce((sum, count) => sum + count, 0);
  const successCount = totalRequests - totalErrors;

  // Data for main pie chart (success vs errors)
  const successErrorData = [
    { name: "Success", value: successCount },
    { name: "Errors", value: totalErrors }
  ];

  // Data for error breakdown (by status code)
  const errorBreakdownData = Object.entries(errorDistribution)
    .filter(([code]) => !["401", "403"].includes(code)) // Exclude auth errors
    .map(([code, count]) => ({
      name: `HTTP ${code}`,
      value: count,
      percentage: totalErrors > 0 ? ((count / totalErrors) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.value - a.value) // Sort descending
    .slice(0, 4); // Limit to top 4

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Success/Error Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Request Status</h4>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={successErrorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {successErrorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE_ERROR[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value) => [
                      new Intl.NumberFormat("en-US").format(value),
                      totalRequests > 0 
                        ? `${((value / totalRequests) * 100).toFixed(1)}%` 
                        : "0%"
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium">Successful Requests</span>
                  <span className="ml-auto font-semibold">
                    {new Intl.NumberFormat("en-US").format(successCount)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm font-medium">Error Requests</span>
                  <span className="ml-auto font-semibold">
                    {new Intl.NumberFormat("en-US").format(totalErrors)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">Total Requests</div>
                  <div className="text-xl font-bold">
                    {new Intl.NumberFormat("en-US").format(totalRequests)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Breakdown Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Error Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={errorBreakdownData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [
                  new Intl.NumberFormat("en-US").format(value),
                  `${((value / totalErrors) * 100).toFixed(1)}% of errors`
                ]}
              />
              <Bar dataKey="value" name="Errors">
                {errorBreakdownData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS_ERROR_BREAKDOWN[index % COLORS_ERROR_BREAKDOWN.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Error List */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 mb-3">Top Error Sources</h4>
        <div className="space-y-3">
          {Object.entries(errorRates)
            .filter(([endpoint]) => !endpoint.includes("auth") && !endpoint.includes("401") && !endpoint.includes("403"))
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([endpoint, count], index) => {
              const [api, code] = endpoint.split(" - ");
              const percentage = totalErrors > 0 ? ((count / totalErrors) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-red-900">
                      {api.split(":").pop() || api}
                    </div>
                    <div className="text-sm text-red-700">HTTP {code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-900">
                      {new Intl.NumberFormat("en-US").format(count)}
                    </div>
                    <div className="text-sm text-red-700">{percentage}% of errors</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await api.fetchMetrics();
        setMetrics(data.data || data);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to fetch metrics");
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 max-w-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <p className="text-gray-600">No metrics data available to display.</p>
        </div>
      </div>
    );
  }

  const getAppFromApi = (apiName) => {
    if (!apiName) return "Other";
    if (apiName.includes("scheduler")) return "Course Scheduler";
    if (apiName.includes("gpacalc")) return "GPA Calculator";
    if (apiName.includes("coopforum")) return "Forum";
    if (apiName.includes("auth")) return "Authentication";
    if (apiName.includes("metrics")) return "Analytics Service";
    return "General API";
  };

  const groupApisByApp = (apis) => {
    const apps = {};
    Object.entries(apis || {}).forEach(([name, data]) => {
      const appName = getAppFromApi(name);
      if (!apps[appName]) {
        apps[appName] = { request_count: data.request_count, apis: [name] };
      } else {
        apps[appName].request_count += data.request_count;
        apps[appName].apis.push(name);
      }
    });

    return Object.entries(apps)
      .sort((a, b) => b[1].request_count - a[1].request_count)
      .slice(0, 6); // Top 6 apps
  };

  const filteredErrorRates = filterNonAuthErrors(metrics.error_rates);

  // Data for "Top API Response Times" Bar Chart
  const topApiPerformanceData = Object.entries(
    groupApisByEndpoint(metrics.most_popular_apis || {})
  )
    .sort(([, a], [, b]) => b.avg_duration - a.avg_duration) // Sort by average duration (slowest first)
    .slice(0, 7) // Take top 7
    .map(([endpoint, data]) => ({
      name: endpoint,
      "Avg. Response Time": Math.round(data.avg_duration * 1000), // Convert to ms
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="py-4 border-b border-gray-200">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            System Overview Dashboard
          </h1>
          <p className="text-lg text-gray-700">
            Real-time insights into performance, reliability, and user engagement.
          </p>
        </div>

        {/* Key Performance Indicators */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Daily Active Users"
              value={metrics.dau || 0}
              icon={Users}
              subtitle="Unique users in last 24h"
            />
            <MetricCard
              title="Total Requests"
              value={metrics.total_requests_24h || 0}
              icon={Activity}
              subtitle="All requests in last 24h"
              format="number"
            />
            <MetricCard
              title="Avg Response Time"
              value={metrics.avg_response_time * 1000 || 0} // Convert to MS here
              format="ms"
              icon={Timer}
              status={
                metrics.avg_response_time < 0.2
                  ? "good"
                  : metrics.avg_response_time < 0.5
                  ? "warning"
                  : "critical"
              }
              subtitle="System-wide average"
            />
            <MetricCard
              title="Success Rate"
              value={metrics.success_rate || 0}
              format="percentage"
              icon={LineChartIcon}
              status={
                (metrics.success_rate || 0) >= 99
                  ? "good"
                  : (metrics.success_rate || 0) >= 95
                  ? "warning"
                  : "critical"
              }
              subtitle="Percentage of successful requests"
            />
          </div>
        </section>

        {/* API Performance & Reliability */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            API Performance & Reliability
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Top API Health" icon={Server} className="lg:col-span-2">
              <p className="text-gray-600 text-sm mb-4">
                Overview of the most popular API endpoints by request count and their average
                response times.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ApiHealthList apis={metrics.most_popular_apis || {}} />
                <RenderBarChart
                  title="Average Response Times of Top APIs"
                  data={topApiPerformanceData}
                  dataKey="name"
                  valueKey="Avg. Response Time"
                  yAxisUnit="ms"
                  className="h-full"
                />
              </div>
            </Card>

            <Card title="Error Analytics" icon={AlertTriangle}>
              <p className="text-gray-600 text-sm mb-4">
                Detailed breakdown of system errors, excluding authentication failures.
              </p>
              <ErrorAnalysis
                errorRates={filteredErrorRates}
                errorDistribution={filteredErrorRates.error_distribution || {}}
                totalRequests={filteredErrorRates.total_requests_24h}
              />
            </Card>
          </div>
        </section>

        {/* Latency & Throughput */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Latency & Throughput
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="P95 Latency"
              value={metrics.p95_latency * 1000 || 0}
              format="ms"
              icon={Clock}
              status={
                (metrics.p95_latency || 0) < 0.3
                  ? "good"
                  : (metrics.p95_latency || 0) < 0.5
                  ? "warning"
                  : "critical"
              }
              subtitle="95% of requests complete within this time"
            />
            <MetricCard
              title="P99 Latency"
              value={metrics.p99_latency * 1000 || 0}
              format="ms"
              icon={Timer}
              status={
                (metrics.p99_latency || 0) < 0.5
                  ? "good"
                  : (metrics.p99_latency || 0) < 1.0
                  ? "warning"
                  : "critical"
              }
              subtitle="99% of requests complete within this time"
            />
            <MetricCard
              title="Average Throughput"
              value={(metrics.total_requests_24h || 0) / 24}
              format="requestsPerHour"
              icon={Activity}
              subtitle="Requests per hour (24h average)"
            />
          </div>
        </section>

        {/* Deep Dive & Trends */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Performance Deep Dive
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Slowest APIs Analysis" icon={Zap}>
              <p className="text-sm text-gray-600 mb-4">
                Identify API endpoints with the highest response times for optimization.
              </p>
              <div className="space-y-4">
                {Object.entries(metrics.slowest_apis || {})
                  .sort(([, a], [, b]) => b.avg_duration - a.avg_duration)
                  .slice(0, 5) // Limit to top 5 slowest
                  .map(([name, data]) => (
                    <div
                      key={name}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {name.split(":").pop() || name}
                        </div>
                        <div
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            data.avg_duration < 0.2
                              ? "bg-green-100 text-green-800"
                              : data.avg_duration < 0.5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {data.avg_duration < 0.2
                            ? "FAST"
                            : data.avg_duration < 0.5
                            ? "SLOW"
                            : "CRITICAL"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-500">Avg Response:</span>
                          <div className="font-semibold text-gray-800">
                            {Math.round(data.avg_duration * 1000)}ms
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Requests:</span>
                          <div className="font-semibold text-gray-800">
                            {new Intl.NumberFormat("en-US").format(data.request_count)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              data.avg_duration < 0.2
                                ? "bg-green-500"
                                : data.avg_duration < 0.5
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min((data.avg_duration / 1.0) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card title="Traffic Volume Trends" icon={LineChartIcon}>
              <p className="text-sm text-gray-600 mb-4">
                Visualize hourly request volume to identify usage patterns and peak times.
              </p>
              <RenderLineChart
                title="Hourly Request Volume (Last 24h)"
                data={metrics.hourly_volume || []}
                dataKey="hour"
                valueKey="request_count"
                yAxisUnit=" requests"
              />
            </Card>
          </div>
        </section>

        {/* User Engagement & Application Usage */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            User Engagement & App Usage
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Engagement Overview" icon={Users}>
              <p className="text-sm text-gray-600 mb-4">
                Key metrics tracking user activity and session behavior.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-800">
                    {metrics.wau || 0}
                  </div>
                  <div className="text-sm text-blue-600">Weekly Users</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-800">
                    {metrics.mau || 0}
                  </div>
                  <div className="text-sm text-green-600">Monthly Users</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600">Daily Active Sessions</span>
                  <span className="font-semibold text-gray-900">
                    {metrics.das || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600">Avg Sessions per User</span>
                  <span className="font-semibold text-gray-900">
                    {metrics.average_sessions_per_user?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-600">Daily Engagement Rate</span>
                  <span className="font-semibold text-gray-900">
                    {metrics.total_users > 0
                      ? `${(((metrics.dau || 0) / metrics.total_users) * 100).toFixed(
                          1
                        )}%`
                      : "0.0%"}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Top Application Usage" icon={Eye}>
              <p className="text-sm text-gray-600 mb-4">
                Applications generating the most API requests.
              </p>
              <div className="space-y-3">
                {groupApisByApp(metrics.api_performance).map(([appName, data]) => (
                  <div
                    key={appName}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{appName}</div>
                      <div className="text-sm text-gray-500">
                        {data.apis.length} endpoints
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {new Intl.NumberFormat("en-US").format(data.request_count)}
                      </div>
                      <div className="text-sm text-gray-500">requests</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Security & Alerts */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Security & Compliance
          </h2>
          <Card title="Security Incidents Summary" icon={AlertTriangle}>
            <p className="text-sm text-gray-600 mb-4">
              Monitoring for unauthorized access attempts and server-side errors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <MetricCard
                title="Auth Failures (401)"
                value={metrics.error_distribution?.["401"] || 0}
                icon={AlertTriangle}
                status="critical"
                subtitle="Unauthorized attempts detected"
              />
              <MetricCard
                title="Forbidden Access (403)"
                value={metrics.error_distribution?.["403"] || 0}
                icon={AlertCircle}
                status="warning"
                subtitle="Access denied requests"
              />
              <MetricCard
                title="Server Errors (5xx)"
                value={Object.entries(metrics.error_distribution || {})
                  .filter(([code]) => parseInt(code, 10) >= 500) // Ensure comparison with number
                  .reduce((sum, [, count]) => sum + count, 0)}
                icon={Server}
                status="critical"
                subtitle="Internal server issues"
              />
              <MetricCard
                title="Not Found (404)"
                value={metrics.error_distribution?.["404"] || 0}
                icon={AlertCircle}
                status="neutral"
                subtitle="Missing API endpoints/resources"
              />
            </div>

            <h4 className="font-semibold text-gray-900 mt-6 mb-4">
              Top Security-Related Events
            </h4>
            <div className="space-y-3">
              {Object.entries(metrics.error_rates || {})
                .filter(([endpoint]) => endpoint.includes("401") || endpoint.includes("403"))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3) // Show top 3 specific security errors
                .map(([endpoint, count]) => {
                  const [api, code] = endpoint.split(" - ");
                  const severity = code === "401" ? "high" : "medium";

                  return (
                    <div
                      key={endpoint}
                      className={`p-3 rounded-lg border shadow-sm ${
                        severity === "high"
                          ? "bg-red-50 border-red-200"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div
                            className={`font-medium ${
                              severity === "high" ? "text-red-900" : "text-amber-900"
                            }`}
                          >
                            {api.split(":").pop()}
                          </div>
                          <div
                            className={`text-xs ${
                              severity === "high" ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {code === "401" ? "Authentication Failed" : "Access Forbidden"}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            severity === "high"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {count} events
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;