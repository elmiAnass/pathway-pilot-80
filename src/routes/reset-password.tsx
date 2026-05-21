import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, refresh, isAdmin } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    if (!user) return toast.error("Not signed in");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    await refresh();
    setLoading(false);
    toast.success("Password updated");
    navigate({ to: isAdmin ? "/admin" : "/student" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-2xl bg-gradient-gold p-3 shadow-gold">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-semibold">{t("auth.firstLogin")}</h1>
        </div>
        <Card className="border-border/60 bg-card/80 p-6 shadow-elevated">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">{t("auth.newPassword")}</Label>
              <Input
                id="np"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">{t("auth.confirmPassword")}</Label>
              <Input
                id="cp"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold font-semibold text-primary-foreground shadow-gold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.updatePassword")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
