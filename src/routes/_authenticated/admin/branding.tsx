import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: BrandingPage,
});

function BrandingPage() {
  const { agency, refresh } = useAuth();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#F5A623");
  const [logo, setLogo] = useState("");
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agency) {
      setName(agency.name);
      setColor(agency.primary_color);
      setLogo(agency.logo_url ?? "");
    }
  }, [agency]);

  const save = async () => {
    if (!agency) return;
    setSaving(true);
    const { error } = await supabase
      .from("agencies")
      .update({
        name,
        primary_color: color,
        logo_url: logo || null,
        custom_domain: domain || null,
      })
      .eq("id", agency.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Image de marque mise à jour");
    refresh();
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold">Image de marque</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personnalisez l'apparence de votre portail.
      </p>

      <Card className="mt-6 border-border bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Nom de l'agence</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Couleur primaire</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-transparent"
            />
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>URL du logo (PNG/SVG)</Label>
          <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
          {logo && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-2">
              <img src={logo} alt="logo" className="h-8 w-8 rounded object-cover" />
              <span className="text-xs text-muted-foreground">Aperçu</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Domaine personnalisé (optionnel)</Label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="portail.monagence.com"
          />
          <p className="text-[11px] text-muted-foreground">
            Configurez le DNS pour pointer vers l'application puis collez le domaine ici.
          </p>
        </div>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full bg-gradient-gold text-primary-foreground shadow-gold"
        >
          <Palette className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </Card>
    </div>
  );
}
