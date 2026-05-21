import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

export type Role = "superadmin" | "agency_admin" | "student";

export interface Profile {
  id: string;
  agency_id: string | null;
  name: string;
  email: string;
  current_step: number;
  must_change_password: boolean;
  avatar_url: string | null;
  preferred_language: string;
}

export interface Agency {
  id: string;
  name: string;
  primary_color: string;
  logo_url: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  agency: Agency | null;
  roles: Role[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

  const loadProfile = async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);

    if (prof) {
      setProfile(prof as unknown as Profile);
      if (prof.agency_id) {
        const { data: ag } = await supabase
          .from("agencies")
          .select("id,name,primary_color,logo_url")
          .eq("id", prof.agency_id)
          .maybeSingle();
        setAgency((ag as unknown as Agency) ?? null);
      } else {
        setAgency(null);
      }
    } else {
      setProfile(null);
      setAgency(null);
    }
    setRoles(((roleRows ?? []) as { role: Role }[]).map((r) => r.role));
  };

  const refresh = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  useEffect(() => {
    // Subscribe FIRST, then getSession (Lovable best practice)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer to avoid deadlock
        setTimeout(() => {
          loadProfile(s.user.id).finally(() => setLoading(false));
          queryClient.invalidateQueries();
          router.invalidate();
        }, 0);
      } else {
        setProfile(null);
        setAgency(null);
        setRoles([]);
        setLoading(false);
        queryClient.clear();
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply agency branding to CSS variables
  useEffect(() => {
    if (agency?.primary_color && typeof document !== "undefined") {
      document.documentElement.style.setProperty("--brand-color", agency.primary_color);
    }
  }, [agency]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      agency,
      roles,
      isAuthenticated: !!session,
      isAdmin: roles.includes("agency_admin") || roles.includes("superadmin"),
      isStudent: roles.includes("student"),
      loading,
      refresh,
      signOut,
    }),
    [session, profile, agency, roles, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
