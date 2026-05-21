import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Users, Clock, Plane, GraduationCap, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { agency } = useAuth();
  const { t } = useI18n();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const [students, pending, visas] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agency!.id),
        supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agency!.id)
          .eq("status", "pending"),
        supabase
          .from("step_progress")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agency!.id)
          .eq("step", 6),
      ]);
      return {
        students: students.count ?? 0,
        pending: pending.count ?? 0,
        visas: visas.count ?? 0,
      };
    },
  });

  const { data: stepDistribution = [] } = useQuery({
    queryKey: ["step-dist", agency?.id],
    enabled: !!agency,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("current_step")
        .eq("agency_id", agency!.id);
      const counts = new Array(7).fill(0);
      (data ?? []).forEach((p: any) => {
        const i = (p.current_step ?? 1) - 1;
        if (i >= 0 && i < 7) counts[i]++;
      });
      return counts.map((c, i) => ({ step: i + 1, count: c }));
    },
  });

  const max = Math.max(1, ...(stepDistribution as any[]).map((d) => d.count));

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">CRM</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
          {t("crm.dashboard")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d'ensemble — {agency?.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard icon={Users} label={t("crm.kpi.students")} value={stats?.students ?? 0} color="primary" />
        <KpiCard icon={Clock} label={t("crm.kpi.pending")} value={stats?.pending ?? 0} color="warning" />
        <KpiCard icon={Plane} label={t("crm.kpi.visas")} value={stats?.visas ?? 0} color="success" />
      </div>

      <Card className="border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Distribution par étape</h3>
            <p className="text-xs text-muted-foreground">Où se trouvent vos étudiants</p>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-3">
          {(stepDistribution as any[]).map((d) => (
            <div key={d.step} className="flex items-center gap-3">
              <span className="w-14 text-xs text-muted-foreground">Étape {d.step}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-surface-2 h-2.5">
                <div
                  className="h-full bg-gradient-gold transition-all"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold">{d.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: "primary" | "warning" | "success";
}) {
  const ring = color === "primary" ? "bg-primary/15 text-primary" : color === "warning" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";
  return (
    <Card className="border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ring}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}
