import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { inviteStudent } from "@/lib/agency.functions";
import { toast } from "sonner";
import { Loader2, Copy, UserPlus, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/invite")({
  component: InvitePage,
});

function InvitePage() {
  const invite = useServerFn(inviteStudent);
  const { agency } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [lastInvite, setLastInvite] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["agency-students-list", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,name,email,created_at,must_change_password")
        .eq("agency_id", agency!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const submit = async () => {
    if (!f.name || !f.email) return toast.error("Nom et email requis");
    setLoading(true);
    try {
      const r = await invite({ data: f });
      setLastInvite({ email: r.email, password: r.tempPassword });
      setF({ name: "", email: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["agency-students-list"] });
      qc.invalidateQueries({ queryKey: ["agency-students"] });
      toast.success("Étudiant invité");
    } catch (e: any) {
      toast.error(e.message ?? "Échec");
    }
    setLoading(false);
  };

  const copyCreds = () => {
    if (!lastInvite) return;
    const text = `Email: ${lastInvite.email}\nMot de passe temporaire: ${lastInvite.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Inviter un étudiant</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Créez un compte étudiant — un mot de passe temporaire sera généré.
      </p>

      <Card className="mt-6 border-border bg-card p-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom complet</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone (optionnel)</Label>
            <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground shadow-gold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Créer l'invitation</>}
          </Button>
        </div>
      </Card>

      {lastInvite && (
        <Card className="mt-4 border-success/40 bg-success/10 p-5">
          <p className="text-sm font-semibold text-success">Identifiants générés</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Transmettez ces informations à l'étudiant. Il devra changer son mot de passe à la première connexion.
          </p>
          <div className="mt-3 rounded-lg bg-background/50 p-3 font-mono text-xs">
            <div>Email: {lastInvite.email}</div>
            <div>Mot de passe: {lastInvite.password}</div>
          </div>
          <Button onClick={copyCreds} size="sm" variant="outline" className="mt-3">
            {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </Card>
      )}

      <h2 className="mt-10 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Étudiants récents
      </h2>
      <div className="space-y-2">
        {(students as any[]).map((s) => (
          <Card key={s.id} className="flex items-center gap-3 border-border bg-card p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-sm font-bold text-primary-foreground">
              {s.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{s.email}</p>
            </div>
            {s.must_change_password && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                en attente
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
