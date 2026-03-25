import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Eye,
  Zap,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useModules } from "../../hooks/useModules";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { formatDistanceToNow } from "date-fns";

// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div
          className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
          <p className="text-sm text-gray-500">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const { stats, sessions, loading: analyticsLoading } = useAnalytics();
  const { modules, loading: modulesLoading } = useModules();
  const navigate = useNavigate();

  const recentModules = [...modules].slice(0, 4);
  const recentSessions = [...sessions].slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of your AR learning modules
          </p>
        </div>
        <Button onClick={() => navigate("/modules/new")}>
          <Plus size={16} /> New Module
        </Button>
      </div>

      {/* Stat Cards */}
      {analyticsLoading ? (
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
            icon={Eye}
            label="Published Modules"
            value={stats?.publishedModules}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Users}
            label="Total Sessions"
            value={stats?.totalSessions}
            color="bg-violet-500"
          />
          <StatCard
            icon={Zap}
            label="Discoveries (7 days)"
            value={stats?.discoveriesLast7Days}
            color="bg-amber-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Modules */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Modules</h2>
            <Link
              to="/modules"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              View all <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {modulesLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner />
              </div>
            ) : recentModules.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  No modules yet.{" "}
                  <Link
                    to="/modules/new"
                    className="text-indigo-600 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentModules.map((mod) => (
                  <li
                    key={mod.id}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-indigo-100 shrink-0">
                      {mod.cover_image_url ? (
                        <img
                          src={mod.cover_image_url}
                          alt={mod.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen size={20} className="m-2.5 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/modules/${mod.id}`}
                        className="font-medium text-sm text-gray-900 hover:text-indigo-600 transition-colors truncate block"
                      >
                        {mod.title}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {mod.subject || "No subject"} &bull;{" "}
                        {mod.objects?.[0]?.count ?? 0} objects
                      </p>
                    </div>
                    <Badge label={mod.status} variant={mod.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
          </CardHeader>
          <CardBody className="p-0">
            {analyticsLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner />
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Clock size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No student sessions yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentSessions.map((s) => (
                  <li key={s.id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.student_name}
                      </p>
                      {s.completed_at ? (
                        <span className="text-xs text-emerald-600 font-medium">
                          Done
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(s.started_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
