"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inviteApi } from "@/lib/invite-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Lock, User } from "lucide-react";

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<{ email: string; role: string; department?: string; invitedBy: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inviteApi.validateToken(token)
      .then(setInvite)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { token: jwt, user } = await inviteApi.acceptInvite(token, {
        name: form.name,
        password: form.password,
      });
      localStorage.setItem("token", jwt);
      localStorage.setItem("userId", user.id);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        <div className="flex justify-end mb-6">
          <div className="flex items-center text-lg font-semibold text-gray-800">
            <Globe className="h-6 w-6 mr-2 text-gray-600" />
            manager
          </div>
        </div>

        {error && !invite ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Invite</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">Go to Login</Button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-medium text-gray-900 mb-1">You're invited</h2>
            <p className="text-gray-500 mb-1">
              <span className="font-medium">{invite?.invitedBy}</span> invited you to join as{" "}
              <span className="font-medium capitalize">{invite?.role}</span>
              {invite?.department && <> · <span className="capitalize">{invite.department}</span></>}
            </p>
            <p className="text-sm text-gray-400 mb-8">{invite?.email}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Your full name"
                  className="pl-10 text-gray-900"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Choose a password"
                  className="pl-10 text-gray-900"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  className="pl-10 text-gray-900"
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={submitting || !form.name || !form.password || !form.confirm}
              >
                {submitting ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
