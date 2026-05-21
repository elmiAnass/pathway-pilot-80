import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { LogOut, Globe, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/menu")({
  component: MenuPage,
});

function MenuPage() {
  const { profile, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  return (
    <div className="px-5 pt-8">
      <h1 className="mb-5 font-display text-2xl font-semibold">{t("nav.menu")}</h1>

      <Card className="mb-4 border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{profile?.name}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-4 border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" /> Langue
        </div>
        <div className="flex gap-2">
          <Button
            variant={lang === "fr" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("fr")}
            className={lang === "fr" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {t("lang.fr")}
          </Button>
          <Button
            variant={lang === "ar" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("ar")}
            className={lang === "ar" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {t("lang.ar")}
          </Button>
        </div>
      </Card>

      <Button variant="outline" onClick={signOut} className="w-full">
        <LogOut className="mr-2 h-4 w-4" /> {t("auth.logout")}
      </Button>
    </div>
  );
}
