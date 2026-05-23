import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/test-db")({
  component: TestDbPage,
});

type Counts = {
  profiles: number | string;
  documents: number | string;
  universities: number | string;
  applications: number | string;
};

function TestDbPage() {
  const { user, profile, roles, isAuthenticated, loading, signOut } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const tables = ["profiles", "documents", "universities", "applications"] as const;
      const out: Record<string, number | string> = {};
      for (const t of tables) {
        const { count, error } = await supabase
          .from(t)
          .select("*", { count: "exact", head: true });
        out[t] = error ? `error: ${error.message}` : (count ?? 0);
      }
      setCounts(out as Counts);
    })().catch((e) => setErr(String(e)));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not signed in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Sign in first, then return to <code>/test-db</code> to verify RLS.
            </p>
            <Button asChild>
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Database / RLS Test</h1>
        <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Auth user</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div><span className="text-muted-foreground">id:</span> {user?.id}</div>
          <div><span className="text-muted-foreground">email:</span> {user?.email}</div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">roles:</span>
            {roles.length === 0 && <span className="text-destructive">none</span>}
            {roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My profile (via RLS)</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">
{JSON.stringify(profile, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Row counts visible to me</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-muted-foreground mb-2">
            Director sees all rows. Worker sees only assigned students' rows. Student sees only their own.
          </p>
          {!counts && !err && <div>Counting…</div>}
          {err && <div className="text-destructive">{err}</div>}
          {counts && (
            <ul className="space-y-1">
              <li>profiles: <b>{String(counts.profiles)}</b></li>
              <li>documents: <b>{String(counts.documents)}</b></li>
              <li>universities: <b>{String(counts.universities)}</b></li>
              <li>applications: <b>{String(counts.applications)}</b></li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
