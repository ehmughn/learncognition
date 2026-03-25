import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Shield, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  school: z.string().optional(),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar_url || null,
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const avatarInputRef = useRef(null);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      school: profile?.school || "",
    },
  });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: pwErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSaveProfile(values) {
    setSavingProfile(true);
    let avatar_url = profile?.avatar_url || null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("module-covers")
        .upload(path, avatarFile, { upsert: true });
      if (!uploadErr) {
        const { data } = supabase.storage
          .from("module-covers")
          .getPublicUrl(path);
        avatar_url = data.publicUrl;
      }
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...values,
      avatar_url,
      updated_at: new Date().toISOString(),
    });

    setSavingProfile(false);
    if (error) toast.error("Failed to save profile");
    else {
      toast.success("Profile updated!");
      await refreshProfile();
    }
  }

  async function onChangePassword({ password }) {
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password changed successfully!");
      resetPassword();
    }
  }

  const initials = (profile?.full_name || user?.email || "T")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your account details
        </p>
      </div>

      {/* Avatar + Profile */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Camera size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleProfile(onSaveProfile)} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Camera size={13} className="text-gray-600" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {profile?.full_name || "Your Name"}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <Input
              label="Full Name *"
              placeholder="Your full name"
              error={profileErrors.full_name?.message}
              {...regProfile("full_name")}
            />
            <Input
              label="School / Institution"
              placeholder="Where do you teach?"
              error={profileErrors.school?.message}
              {...regProfile("school")}
            />
            <Input
              label="Email Address"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-50 text-gray-400 cursor-not-allowed"
            />

            <div className="flex justify-end">
              <Button type="submit" loading={savingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <Shield size={16} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={handlePassword(onChangePassword)}
            className="space-y-4"
          >
            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              error={pwErrors.password?.message}
              {...regPassword("password")}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat your new password"
              error={pwErrors.confirm?.message}
              {...regPassword("confirm")}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={savingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="border-red-100 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h2 className="font-semibold text-red-700">Danger Zone</h2>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900 text-sm">Delete Account</p>
            <p className="text-xs text-gray-500">
              Permanently deletes your account and all associated modules. This
              cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} /> Delete
          </Button>
        </CardBody>
      </Card>

      {/* Delete Confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirm("");
        }}
        title="Delete Account"
      >
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently delete your account. Type{" "}
            <strong>delete my account</strong> to confirm.
          </p>
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="delete my account"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirm !== "delete my account"}
              onClick={async () => {
                // Account deletion requires Supabase admin SDK or Edge Function in production
                toast.info(
                  "Account deletion requires server-side processing. Contact your administrator.",
                );
                setDeleteOpen(false);
              }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
