import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Download,
  Copy,
  Volume2,
  Image as ImageIcon,
  QrCode,
  BarChart2,
  List,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useModuleDetail, useModules } from "../../hooks/useModules";
import { useObjects } from "../../hooks/useObjects";
import { useAnalytics } from "../../hooks/useAnalytics";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { formatDistanceToNow, format } from "date-fns";

const TABS = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "objects", label: "Objects", icon: List },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

export default function ModuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { module, setModule, loading } = useModuleDetail(id);
  const { updateModule } = useModules();
  const {
    objects,
    loading: objLoading,
    deleteObject,
    reorderObjects,
  } = useObjects(id);
  const {
    sessions,
    sessionsByDay,
    loading: analyticsLoading,
  } = useAnalytics(id);
  const [tab, setTab] = useState("overview");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const qrRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleTogglePublish() {
    const newStatus = module.status === "published" ? "draft" : "published";
    const { error } = await updateModule(id, { status: newStatus });
    if (error) toast.error("Failed to update status");
    else {
      setModule((m) => ({ ...m, status: newStatus }));
      toast.success(
        newStatus === "published" ? "Module published!" : "Module unpublished",
      );
    }
  }

  async function handleDeleteObject() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteObject(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast.error("Failed to delete object");
    else toast.success("Object removed");
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = objects.findIndex((o) => o.id === active.id);
    const newIndex = objects.findIndex((o) => o.id === over.id);
    reorderObjects(arrayMove(objects, oldIndex, newIndex));
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement("a");
      a.download = `module-${id}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  function exportCSV() {
    const rows = [
      ["Student Name", "Started At", "Completed At", "Status"],
      ...sessions.map((s) => [
        s.student_name,
        s.started_at ? format(new Date(s.started_at), "yyyy-MM-dd HH:mm") : "",
        s.completed_at
          ? format(new Date(s.completed_at), "yyyy-MM-dd HH:mm")
          : "",
        s.completed_at ? "Completed" : "In Progress",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.download = `module-${id}-sessions.csv`;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  if (!module)
    return (
      <div className="text-center py-20 text-gray-400">Module not found.</div>
    );

  const deepLink = `learncognition://module/${id}`;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/modules")}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {module.title}
            </h1>
            <Badge label={module.status} variant={module.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {module.description || "No description"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/modules/${id}/edit`)}
          >
            <Pencil size={14} /> Edit
          </Button>
          <Button
            variant={module.status === "published" ? "secondary" : "success"}
            size="sm"
            onClick={handleTogglePublish}
          >
            {module.status === "published" ? (
              <>
                <EyeOff size={14} /> Unpublish
              </>
            ) : (
              <>
                <Eye size={14} /> Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Info */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Module Info</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {module.cover_image_url && (
                <img
                  src={module.cover_image_url}
                  alt={module.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subject</dt>
                  <dd className="font-medium text-gray-900">
                    {module.subject || "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Difficulty</dt>
                  <dd>
                    <Badge
                      label={module.difficulty || "beginner"}
                      variant={module.difficulty}
                    />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sequential</dt>
                  <dd className="font-medium text-gray-900">
                    {module.is_sequential ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Objects</dt>
                  <dd className="font-medium text-gray-900">
                    {objects.length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-gray-700">
                    {formatDistanceToNow(new Date(module.created_at), {
                      addSuffix: true,
                    })}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Module QR Code</h2>
              <QrCode size={18} className="text-gray-400" />
            </CardHeader>
            <CardBody className="flex flex-col items-center gap-4">
              {module.status === "published" ? (
                <>
                  <div
                    ref={qrRef}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    <QRCodeSVG value={deepLink} size={180} includeMargin />
                  </div>
                  <p className="text-xs text-gray-500 text-center break-all max-w-xs">
                    {deepLink}
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button variant="secondary" size="sm" onClick={downloadQR}>
                      <Download size={14} /> Download PNG
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(deepLink);
                        toast.success("Link copied!");
                      }}
                    >
                      <Copy size={14} /> Copy Link
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <QrCode size={28} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Publish this module to generate its QR code.
                  </p>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleTogglePublish}
                  >
                    <Eye size={14} /> Publish Module
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ─── OBJECTS TAB ─── */}
      {tab === "objects" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {objects.length} object{objects.length !== 1 ? "s" : ""} in this
              module
            </p>
            <Button
              size="sm"
              onClick={() => navigate(`/modules/${id}/objects/new`)}
            >
              <Plus size={14} /> Add Object
            </Button>
          </div>

          {objLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : objects.length === 0 ? (
            <EmptyState
              icon={List}
              title="No objects yet"
              description="Add real-world objects that students will scan with the AR app."
              action={
                <Button
                  size="sm"
                  onClick={() => navigate(`/modules/${id}/objects/new`)}
                >
                  <Plus size={14} /> Add Object
                </Button>
              }
            />
          ) : (
            <Card>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={objects.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-gray-100">
                    {objects.map((obj, idx) => (
                      <SortableObjectRow
                        key={obj.id}
                        obj={obj}
                        index={idx}
                        isSequential={module.is_sequential}
                        onEdit={() =>
                          navigate(`/modules/${id}/objects/${obj.id}/edit`)
                        }
                        onDelete={() => setDeleteTarget(obj)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </Card>
          )}
        </div>
      )}

      {/* ─── ANALYTICS TAB ─── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Module Analytics</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCSV}
              disabled={sessions.length === 0}
            >
              <Download size={14} /> Export CSV
            </Button>
          </div>

          {analyticsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <>
              {/* Sessions chart */}
              <Card>
                <CardHeader>
                  <h3 className="font-medium text-gray-900">
                    Sessions — Last 30 Days
                  </h3>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sessionsByDay.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        name="Sessions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Sessions table */}
              <Card>
                <CardHeader>
                  <h3 className="font-medium text-gray-900">
                    Student Sessions
                  </h3>
                </CardHeader>
                {sessions.length === 0 ? (
                  <CardBody>
                    <EmptyState
                      icon={BarChart2}
                      title="No sessions yet"
                      description="Students haven't used this module yet."
                    />
                  </CardBody>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Student
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Started
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Completed
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sessions.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">
                              {s.student_name}
                            </td>
                            <td className="px-6 py-3 text-gray-500">
                              {s.started_at
                                ? format(
                                    new Date(s.started_at),
                                    "MMM d, yyyy HH:mm",
                                  )
                                : "—"}
                            </td>
                            <td className="px-6 py-3 text-gray-500">
                              {s.completed_at
                                ? format(
                                    new Date(s.completed_at),
                                    "MMM d, yyyy HH:mm",
                                  )
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
            </>
          )}
        </div>
      )}

      {/* Delete Object Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Object"
      >
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Remove{" "}
            <strong className="text-gray-900">"{deleteTarget?.name}"</strong>{" "}
            from this module? This cannot be undone.
          </p>
          <div className="flex gap-3 mt-5 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDeleteObject}
            >
              Remove Object
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SortableObjectRow({ obj, index, isSequential, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: obj.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 px-4 py-3 ${isDragging ? "bg-indigo-50 shadow-lg z-10 relative rounded-lg" : "hover:bg-gray-50"} transition-colors`}
    >
      {isSequential && (
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical size={16} />
        </button>
      )}
      {isSequential && (
        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>
      )}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {obj.image_url ? (
          <img
            src={obj.image_url}
            alt={obj.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={20} className="m-auto mt-3 text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">{obj.name}</p>
        <p className="text-xs text-gray-400 truncate">{obj.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {obj.audio_url && (
          <Volume2 size={14} className="text-indigo-400" title="Has audio" />
        )}
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
