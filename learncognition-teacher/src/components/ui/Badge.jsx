import { cn } from "../../lib/utils";

const colors = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-amber-100 text-amber-700",
  beginner: "bg-blue-100 text-blue-700",
  intermediate: "bg-purple-100 text-purple-700",
  advanced: "bg-rose-100 text-rose-700",
  default: "bg-indigo-100 text-indigo-700",
};

export function Badge({ label, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        colors[variant] || colors.default,
        className,
      )}
    >
      {label}
    </span>
  );
}
