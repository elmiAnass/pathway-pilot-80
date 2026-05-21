import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Check, X, ExternalLink, Clock } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { approveDocument } from "@/lib/agency.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/validation")({
  component: Validation,
});

function Validation() {
  const { agency } = useAuth();
  const qc = useQueryClient();
  const approve = useServerFn(approveDocument);

  const { data: docs = [] } = useQuery({
    queryKey: ["pending-docs", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,type,file_url,file_name,status,step,user_id,is_mandatory,profiles!documents_user_id_fkey(name,email)")
        .eq("agency_id", agency!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pending = (docs as any[]).filter((d) => d.status === "pending");
  const reviewed = (docs as any[]).filter((d) => d.status !== "pending");

  const decide = async (id: string, decision: "approved" | "rejected", feedback?: string) => {
    try {
      await approve({ data: { documentId: id, decision, feedback } });
      toast.success(decision === "approved" ? "Approuvé" : "Rejeté");
      qc.invalidateQueries({ queryKey: ["pending-docs"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">Validation des documents</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Approuver les documents validés ou les rejeter avec un motif.
      </p>

      <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        En attente ({pending.length})
      </h2>
      {pending.length === 0 && (
        <Card className="border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun document en attente. Bon travail !
        </Card>
      )}
      <div className="space-y-3">
        {pending.map((d) => (
          <DocRow key={d.id} doc={d} onDecide={decide} />
        ))}
      </div>

      {reviewed.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Récemment traités
          </h2>
          <div className="space-y-2">
            {reviewed.slice(0, 10).map((d) => (
              <Card key={d.id} className="flex items-center justify-between border-border bg-card p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.profiles?.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      Étape {d.step} · {d.type}
                    </p>
                  </div>
                </div>
                {d.status === "approved" ? (
                  <Badge className="border-0 bg-success/15 text-success">
                    <Check className="mr-1 h-3 w-3" />
                    Approuvé
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-destructive/15 text-destructive">
                    <X className="mr-1 h-3 w-3" />
                    Rejeté
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DocRow({
  doc,
  onDecide,
}: {
  doc: any;
  onDecide: (id: string, d: "approved" | "rejected", fb?: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [rejecting, setRejecting] = useState(false);
  return (
    <Card className="border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{doc.profiles?.name ?? "—"}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {doc.profiles?.email} · Étape {doc.step} · <span className="font-medium">{doc.type}</span>
                {doc.is_mandatory && <span className="ml-1 text-destructive">*</span>}
              </p>
            </div>
          </div>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> {doc.file_name}
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge className="border-0 bg-muted text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" /> En attente
          </Badge>
          <Button
            size="sm"
            className="bg-success text-success-foreground hover:opacity-90"
            onClick={() => onDecide(doc.id, "approved")}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRejecting((v) => !v)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {rejecting && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Motif du rejet…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!feedback}
              onClick={() => {
                onDecide(doc.id, "rejected", feedback);
                setRejecting(false);
                setFeedback("");
              }}
            >
              Confirmer le rejet
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
