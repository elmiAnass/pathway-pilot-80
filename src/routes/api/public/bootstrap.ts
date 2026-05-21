// One-time bootstrap server route: seeds the first agency + admin user.
// Refuses to run once any agency exists.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Schema = z.object({
  agencyName: z.string().min(1).max(120),
  adminName: z.string().min(1).max(120),
  adminEmail: z.string().email().max(255),
  adminPassword: z.string().min(8).max(72),
});

export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = Schema.parse(await request.json());

          const { count } = await supabaseAdmin
            .from("agencies")
            .select("id", { count: "exact", head: true });
          if ((count ?? 0) > 0) {
            return new Response(
              JSON.stringify({ error: "Bootstrap already completed" }),
              { status: 403, headers: { "Content-Type": "application/json" } },
            );
          }

          const { data: agency, error: aErr } = await supabaseAdmin
            .from("agencies")
            .insert({ name: body.agencyName, primary_color: "#F5A623" })
            .select()
            .single();
          if (aErr) throw aErr;

          const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
            email: body.adminEmail,
            password: body.adminPassword,
            email_confirm: true,
            user_metadata: { name: body.adminName },
          });
          if (cErr || !created.user) throw cErr ?? new Error("createUser failed");

          await supabaseAdmin.from("profiles").insert({
            id: created.user.id,
            agency_id: agency.id,
            name: body.adminName,
            email: body.adminEmail,
            must_change_password: false,
          });
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: created.user.id, role: "agency_admin" });

          // Seed a couple of demo universities
          await supabaseAdmin.from("universities").insert([
            {
              agency_id: agency.id,
              name: "Sorbonne Université",
              location: "Paris",
              country: "France",
              price: 4500,
              ranking: 43,
              badges: ["Top 50", "Bourse"],
            },
            {
              agency_id: agency.id,
              name: "ETH Zürich",
              location: "Zürich",
              country: "Suisse",
              price: 1500,
              ranking: 7,
              badges: ["Top 10"],
            },
            {
              agency_id: agency.id,
              name: "McGill University",
              location: "Montréal",
              country: "Canada",
              price: 18000,
              ranking: 31,
              badges: ["Top 50"],
            },
          ]);

          return new Response(JSON.stringify({ ok: true, agencyId: agency.id }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message ?? "Failed" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
