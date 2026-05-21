import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-warning/15 text-warning",
  accepted: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  waitlisted: "bg-primary/15 text-primary",
};

export function Step4Tracking() {
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["applications-tracking", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,notes,universities(name,location,country)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if ((data as any[]).length === 0)
    return (
      <Card className="border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Aucune candidature pour le moment.
      </Card>
    );

  return (
    <div className="space-y-3">
      {(data as any[]).map((a) => (
        <Card key={a.id} className="border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display font-semibold text-foreground">{a.universities?.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {a.universities?.location} {a.universities?.country && `· ${a.universities.country}`}
              </p>
            </div>
            <Badge className={`border-0 ${STATUS_COLORS[a.status] ?? ""}`}>{a.status}</Badge>
          </div>
          {a.notes && <p className="mt-2 text-xs text-muted-foreground">{a.notes}</p>}
        </Card>
      ))}
    </div>
  );
}
