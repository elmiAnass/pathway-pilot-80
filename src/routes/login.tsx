import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const {
    isAuthenticated,
    loading: authLoading,
    profile,
    isDirector,
    isWorker,
    isStudent,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      if (profile?.must_change_password) {
        navigate({ to: "/reset-password" });
      } else if (isDirector) {
        navigate({ to: "/director/dashboard" });
      } else if (isWorker) {
        navigate({ to: "/worker/dashboard" });
      } else if (isStudent) {
        navigate({ to: "/student/portal" });
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    profile,
    isDirector,
    isWorker,
    isStudent,
    navigate,
  ]);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Veuillez saisir une adresse email valide.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Connexion réussie");
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#d4af3720_0%,transparent_40%)]" />

        <div
          className="
            absolute inset-0
            bg-[linear-gradient(to_right,hsl(var(--border)/0.15)_1px,transparent_1px),
            linear-gradient(to_bottom,hsl(var(--border)/0.15)_1px,transparent_1px)]
            bg-[size:50px_50px]
          "
        />
      </div>

      {/* Language Switch */}
      <div className="absolute right-5 top-5 z-20">
        <div className="flex rounded-full border border-border/50 bg-card/80 p-1 backdrop-blur-xl">
          <button
            onClick={() => setLang("fr")}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
              lang === "fr"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            FR
          </button>

          <button
            onClick={() => setLang("ar")}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
              lang === "ar"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            AR
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div
              className="
                mx-auto mb-5 flex h-20 w-20 items-center justify-center
                rounded-3xl
                bg-gradient-to-br
                from-yellow-400
                to-yellow-600
                shadow-2xl
              "
            >
              <GraduationCap className="h-10 w-10 text-black" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {t("app.name")}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.login")}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              Gérez les étudiants, dossiers et admissions depuis
              une plateforme.
            </p>
          </div>

          {/* Card */}
          <Card
            className="
              rounded-3xl
              border-border/50
              bg-card/70
              p-8
              shadow-2xl
              backdrop-blur-xl
            "
          >
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="email@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="
                  h-12
                  w-full
                  rounded-xl
                  bg-gradient-to-r
                  from-yellow-500
                  via-yellow-400
                  to-yellow-500
                  font-semibold
                  text-black
                  transition-all
                  duration-300
                  hover:scale-[1.02]
                "
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t("auth.signIn")
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-border/40 pt-5">
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Accès réservé aux étudiants et aux collaborateurs
                autorisés. Contactez votre agence pour obtenir vos
                identifiants de connexion.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}