import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Search,
  BookOpen,
  Copy,
  Pencil,
  Trash2,
  Archive,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useModules } from "../../hooks/useModules";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { Modal } from "../../components/ui/Modal";

const STATUSES = ["all", "draft", "published", "archived"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A → Z" },
];

export default function ModulesPage() {
  const navigate = useNavigate();
  const { modules, loading, deleteModule, updateModule, duplicateModule } =
    useModules();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let list = [...modules];
    if (search)
      list = list.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase()),
      );
    if (statusFilter !== "all")
      list = list.filter((m) => m.status === statusFilter);
    if (sort === "oldest")
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return list;
  }, [modules, search, statusFilter, sort]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteModule(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast.error("Failed to delete module");
    else toast.success("Module deleted");
  }

  async function handleDuplicate(mod) {
    toast.promise(duplicateModule(mod.id), {
      loading: "Duplicating module…",
      success: "Module duplicated!",
      error: "Failed to duplicate",
    });
  }

  async function handleArchive(mod) {
    const newStatus = mod.status === "archived" ? "draft" : "archived";
    const { error } = await updateModule(mod.id, { status: newStatus });
    if (error) toast.error("Failed to update module");
    else
      toast.success(
        newStatus === "archived"
          ? "Module archived"
          : "Module restored to draft",
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {modules.length} module{modules.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={() => navigate("/modules/new")}>
          <Plus size={16} /> New Module
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            search || statusFilter !== "all"
              ? "No modules match your filters"
              : "No modules yet"
          }
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first AR learning module to get started."
          }
          action={
            !search &&
            statusFilter === "all" && (
              <Button onClick={() => navigate("/modules/new")}>
                <Plus size={16} /> Create Module
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              onDelete={() => setDeleteTarget(mod)}
              onDuplicate={() => handleDuplicate(mod)}
              onArchive={() => handleArchive(mod)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Module"
      >
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <strong className="text-gray-900">"{deleteTarget?.title}"</strong>?
            This will also delete all objects in this module. This action cannot
            be undone.
          </p>
          <div className="flex gap-3 mt-5 justify-end">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Module
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ModuleCard({ mod, onDelete, onDuplicate, onArchive }) {
  const navigate = useNavigate();
  const objCount = mod.objects?.[0]?.count ?? 0;

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group">
      {/* Cover */}
      <div className="relative w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 shrink-0">
        {mod.cover_image_url ? (
          <img
            src={mod.cover_image_url}
            alt={mod.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen
            size={36}
            className="absolute inset-0 m-auto text-indigo-300"
          />
        )}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => navigate(`/modules/${mod.id}`)}
            title="View"
            className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <Eye size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => navigate(`/modules/${mod.id}/edit`)}
            title="Edit"
            className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <Pencil size={14} className="text-gray-600" />
          </button>
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <Copy size={14} className="text-gray-600" />
          </button>
          <button
            onClick={onArchive}
            title="Archive"
            className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <Archive size={14} className="text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>

      <CardBody className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/modules/${mod.id}`}
            className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-tight line-clamp-2"
          >
            {mod.title}
          </Link>
          <Badge label={mod.status} variant={mod.status} className="shrink-0" />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-auto">
          {mod.subject && <Badge label={mod.subject} variant="default" />}
          {mod.difficulty && (
            <Badge label={mod.difficulty} variant={mod.difficulty} />
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {objCount} object{objCount !== 1 ? "s" : ""}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
