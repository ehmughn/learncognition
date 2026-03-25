import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  if (user) return <Navigate to="/" replace />;

  async function onSubmit({ email, password }) {
    setAuthError("");
    const { error } = await signIn(email, password);
    if (error) {
      setAuthError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : error.message,
      );
    } else {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LearnCognition</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Teacher Portal — Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@school.edu"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            {authError && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                {authError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting}
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Contact your administrator to create an account.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          LearnCognition AR Learning Platform &copy; 2026
        </p>
      </div>
    </div>
  );
}
