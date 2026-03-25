import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Lightbulb,
  Eye,
  Volume2,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useObjects } from "../../hooks/useObjects";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { FileUpload } from "../../components/ui/FileUpload";
import { AudioUpload } from "../../components/ui/AudioUpload";
import { Spinner } from "../../components/ui/Spinner";

const schema = z.object({
  name: z.string().min(1, "Object name is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

const SPED_TIPS = [
  "Use short, simple sentences (5–8 words max).",
  "Describe what the object looks like, feels like, or is used for.",
  "Avoid jargon — use words the student already knows.",
  "One main idea per sentence.",
];

export default function ObjectFormPage() {
  const { id: moduleId, objId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(objId);

  const { createObject, updateObject, uploadObjectImage, uploadObjectAudio } =
    useObjects(moduleId);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState(null);
  const [loadingObj, setLoadingObj] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const watchedName = watch("name");
  const watchedDescription = watch("description");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const { data, error } = await supabase
        .from("objects")
        .select("*")
        .eq("id", objId)
        .single();
      if (error || !data) {
        toast.error("Object not found");
        navigate(`/modules/${moduleId}`);
        return;
      }
      reset({ name: data.name, description: data.description });
      if (data.image_url) {
        setImagePreview(data.image_url);
        setExistingImageUrl(data.image_url);
      }
      if (data.audio_url) {
        setExistingAudioUrl(data.audio_url);
      }
      setLoadingObj(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objId, isEdit]);

  function handleImageChange(file) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values) {
    setSubmitting(true);

    let image_url = existingImageUrl || null;
    let audio_url = existingAudioUrl || null;

    if (imageFile) {
      const { url, error } = await uploadObjectImage(imageFile);
      if (error) {
        toast.error("Failed to upload image");
        setSubmitting(false);
        return;
      }
      image_url = url;
    }

    if (audioFile) {
      const { url, error } = await uploadObjectAudio(audioFile);
      if (error) {
        toast.error("Failed to upload audio");
        setSubmitting(false);
        return;
      }
      audio_url = url;
    }

    const payload = { ...values, image_url, audio_url };

    let error;
    if (isEdit) {
      ({ error } = await updateObject(objId, payload));
    } else {
      ({ error } = await createObject(payload));
    }

    setSubmitting(false);

    if (error) {
      toast.error(
        `Failed to ${isEdit ? "update" : "add"} object: ${error.message}`,
      );
    } else {
      toast.success(isEdit ? "Object updated!" : "Object added to module!");
      navigate(`/modules/${moduleId}`, { state: { tab: "objects" } });
    }
  }

  if (loadingObj)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/modules/${moduleId}`)}
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Object" : "Add Object"}
          </h1>
          <p className="text-sm text-gray-500">
            Define a real-world object for students to find with AR
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Object Details</h2>
            </CardHeader>
            <CardBody>
              <form
                id="obj-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <Input
                  label="Object Name *"
                  placeholder="e.g. Red Chair"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Textarea
                  label="Description *"
                  placeholder="Write a short, simple description…"
                  rows={5}
                  error={errors.description?.message}
                  helper="This description appears in AR when the student finds the object."
                  {...register("description")}
                />
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Media Assets</h2>
            </CardHeader>
            <CardBody className="space-y-5">
              <FileUpload
                label="Reference Image"
                value={imagePreview}
                onChange={handleImageChange}
                hint="Shown in the AR overlay when the object is discovered."
              />
              <AudioUpload
                value={existingAudioUrl}
                onChange={setAudioFile}
                label="Audio Narration"
              />
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/modules/${moduleId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" form="obj-form" loading={submitting}>
              {isEdit ? "Save Changes" : "Add Object"}
            </Button>
          </div>
        </div>

        {/* Right: Preview + SPED Tips */}
        <div className="lg:col-span-2 space-y-5">
          {/* AR Preview Card */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Eye size={16} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">AR Preview</h2>
            </CardHeader>
            <CardBody>
              <div className="bg-gray-900 rounded-xl p-4 space-y-3 min-h-48">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                    <ImageIcon size={28} className="text-gray-600" />
                  </div>
                )}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white font-bold text-sm">
                    {watchedName || "Object Name"}
                  </p>
                  <p className="text-white/80 text-xs mt-1 leading-relaxed">
                    {watchedDescription || "Your description will appear here…"}
                  </p>
                  {(audioFile || existingAudioUrl) && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Volume2 size={12} className="text-indigo-300" />
                      <span className="text-indigo-300 text-xs">
                        Audio available
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Approximate AR overlay appearance
              </p>
            </CardBody>
          </Card>

          {/* SPED Tips */}
          <Card className="border-amber-100 bg-amber-50/50">
            <CardHeader className="flex items-center gap-2 border-amber-100">
              <Lightbulb size={16} className="text-amber-500" />
              <h2 className="font-semibold text-amber-800">
                SPED Writing Tips
              </h2>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2">
                {SPED_TIPS.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-amber-700"
                  >
                    <span className="w-4 h-4 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
