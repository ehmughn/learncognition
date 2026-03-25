import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Users, BookOpen, Zap, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "../../hooks/useAnalytics";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { format } from "date-fns";

// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div
          className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}
        >
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { stats, sessionsByDay, topModules, sessions, loading } =
    useAnalytics();
  const [dateRange, setDateRange] = useState(30);

  const filteredDays = sessionsByDay.slice(-dateRange);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cross-module engagement overview
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange === d ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardBody className="h-24 flex items-center justify-center">
                <Spinner />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Modules"
            value={stats?.totalModules}
            color="bg-indigo-500"
          />
          <StatCard
            icon={BookOpen}
            label="Published"
            value={stats?.publishedModules}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Users}
            label="All Sessions"
            value={stats?.totalSessions}
            color="bg-violet-500"
          />
          <StatCard
            icon={Zap}
            label="Discoveries (7d)"
            value={stats?.discoveriesLast7Days}
            color="bg-amber-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Student Sessions Over Time
            </h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={filteredDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval={Math.floor(filteredDays.length / 6)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Top Modules */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Modules</h2>
            <Link
              to="/modules"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              All <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : topModules.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data yet" />
            ) : (
              <div className="space-y-3">
                {topModules.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/modules/${m.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block"
                      >
                        {m.title}
                      </Link>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (m.sessions / (topModules[0]?.sessions || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {m.sessions}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sessions Bar Chart */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">
            Daily Session Distribution
          </h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={filteredDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(filteredDays.length / 6)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#a5b4fc"
                  radius={[3, 3, 0, 0]}
                  name="Sessions"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">All Recent Sessions</h2>
        </CardHeader>
        {loading ? (
          <CardBody>
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          </CardBody>
        ) : sessions.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Users}
              title="No sessions yet"
              description="Students haven't used any module yet."
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Module
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Started
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.slice(0, 20).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {s.student_name}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      <Link
                        to={`/modules/${s.module_id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {s.module_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {s.started_at
                        ? format(new Date(s.started_at), "MMM d, HH:mm")
                        : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {s.completed_at ? (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
