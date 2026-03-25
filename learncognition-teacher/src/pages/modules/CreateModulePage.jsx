import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useModules } from "../../hooks/useModules";
import { ModuleForm } from "./ModuleForm";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function CreateModulePage() {
  const navigate = useNavigate();
  const { createModule, uploadCoverImage } = useModules();
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleCoverChange(file) {
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    let cover_image_url = null;

    if (coverFile) {
      const { url, error } = await uploadCoverImage(coverFile);
      if (error) {
        toast.error("Failed to upload cover image");
        setSubmitting(false);
        return;
      }
      cover_image_url = url;
    }

    const { data, error } = await createModule({
      ...values,
      cover_image_url,
      status: "draft",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to create module: " + error.message);
    } else {
      toast.success("Module created! Now add objects to it.");
      navigate(`/modules/${data.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/modules")}
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Module</h1>
          <p className="text-sm text-gray-500">New AR learning module</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Module Details</h2>
        </CardHeader>
        <CardBody>
          <ModuleForm
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Create Module"
            onCoverChange={handleCoverChange}
            coverPreview={coverPreview}
          />
        </CardBody>
      </Card>
    </div>
  );
}
