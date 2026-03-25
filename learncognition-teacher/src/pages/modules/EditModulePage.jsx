import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useModules, useModuleDetail } from "../../hooks/useModules";
import { ModuleForm } from "./ModuleForm";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";

export default function EditModulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { module, loading } = useModuleDetail(id);
  const { updateModule, uploadCoverImage } = useModules();
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (module?.cover_image_url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoverPreview(module.cover_image_url);
    }
  }, [module]);

  function handleCoverChange(file) {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    let cover_image_url = module?.cover_image_url || null;

    if (coverFile) {
      const { url, error } = await uploadCoverImage(coverFile);
      if (error) {
        toast.error("Failed to upload cover image");
        setSubmitting(false);
        return;
      }
      cover_image_url = url;
    }

    const { error } = await updateModule(id, { ...values, cover_image_url });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to update module: " + error.message);
    } else {
      toast.success("Module updated!");
      navigate(`/modules/${id}`);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/modules/${id}`)}
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {module?.title}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Module Details</h2>
        </CardHeader>
        <CardBody>
          {module && (
            <ModuleForm
              defaultValues={{
                title: module.title,
                description: module.description || "",
                subject: module.subject || "",
                difficulty: module.difficulty || "beginner",
                is_sequential: module.is_sequential || false,
              }}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Save Changes"
              onCoverChange={handleCoverChange}
              coverPreview={coverPreview}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
