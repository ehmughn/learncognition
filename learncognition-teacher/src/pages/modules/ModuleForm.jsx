import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Info } from "lucide-react";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/ui/FileUpload";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  subject: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  is_sequential: z.boolean(),
});

export function ModuleForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Save Module",
  onCoverChange,
  coverPreview,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      difficulty: "beginner",
      is_sequential: false,
      ...defaultValues,
    },
  });

  // eslint-disable-next-line no-unused-vars
  const isSequential = watch("is_sequential");

  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([k, v]) => setValue(k, v));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cover Image */}
      <FileUpload
        label="Cover Image"
        value={coverPreview}
        onChange={onCoverChange}
        hint="JPG, PNG, WEBP up to 5MB. Recommended: 16:9 aspect ratio."
      />

      {/* Title */}
      <Input
        label="Module Title *"
        placeholder="e.g. Animals in Our Classroom"
        error={errors.title?.message}
        {...register("title")}
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="What will students explore in this module?"
        error={errors.description?.message}
        rows={3}
        {...register("description")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Subject */}
        <Select label="Subject" {...register("subject")}>
          <option value="">— Select Subject —</option>
          <option value="Science">Science</option>
          <option value="Math">Math</option>
          <option value="Language Arts">Language Arts</option>
          <option value="Social Studies">Social Studies</option>
          <option value="Art">Art</option>
          <option value="Life Skills">Life Skills</option>
          <option value="Other">Other</option>
        </Select>

        {/* Difficulty */}
        <Select
          label="Difficulty"
          error={errors.difficulty?.message}
          {...register("difficulty")}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      </div>

      {/* Sequential Mode */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <input
          id="sequential"
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          {...register("is_sequential")}
        />
        <label htmlFor="sequential" className="flex-1 cursor-pointer">
          <p className="text-sm font-medium text-gray-900">Sequential Mode</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Students must find objects in order. The AR app will only unlock the
            next object after the current one is found.
          </p>
        </label>
        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={submitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
