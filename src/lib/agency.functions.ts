// Server function to invite a student to an agency.
// Uses admin client to create auth user with temp password and matching profile + role.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function tempPassword() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = "abcdefghijkmnpqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  for (let i = 0; i < 6; i++) s += b[Math.floor(Math.random() * b.length)];
  s += "!" + Math.floor(Math.random() * 90 + 10);
  return s;
}

export const inviteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        name: z.string().min(1).max(120),
        phone: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // verify caller is agency_admin and get their agency
    const [{ data: callerProfile }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("agency_id").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const isAdmin = (roleRows ?? []).some(
      (r: any) => r.role === "agency_admin" || r.role === "superadmin",
    );
    if (!isAdmin || !callerProfile?.agency_id) {
      throw new Error("Forbidden: only agency admins can invite students");
    }

    const password = tempPassword();
    // create auth user (email confirmed, must_change set in profile)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Failed to create user");
    }

    const newUserId = created.user.id;

    // insert profile + role
    const { error: pErr } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      agency_id: callerProfile.agency_id,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      must_change_password: true,
      current_step: 1,
    });
    if (pErr) throw new Error(pErr.message);

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "student" });
    if (rErr) throw new Error(rErr.message);

    // seed step 1 progress
    await supabaseAdmin.from("step_progress").insert({
      user_id: newUserId,
      agency_id: callerProfile.agency_id,
      step: 1,
      status: "in_progress",
    });

    return {
      ok: true,
      email: data.email,
      tempPassword: password,
    };
  });

export const approveDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        documentId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        feedback: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .update({
        status: data.decision,
        feedback: data.feedback ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.documentId)
      .select("user_id, agency_id, step")
      .single();
    if (error || !doc) throw new Error(error?.message ?? "Failed");

    // If all mandatory documents in this step are approved, advance step status to approved
    const { data: allDocs } = await supabase
      .from("documents")
      .select("status,is_mandatory")
      .eq("user_id", doc.user_id)
      .eq("step", doc.step);
    const allMandatoryApproved =
      (allDocs ?? []).filter((d: any) => d.is_mandatory).length > 0 &&
      (allDocs ?? [])
        .filter((d: any) => d.is_mandatory)
        .every((d: any) => d.status === "approved");
    if (allMandatoryApproved) {
      await supabase
        .from("step_progress")
        .upsert(
          {
            user_id: doc.user_id,
            agency_id: doc.agency_id,
            step: doc.step,
            status: "approved",
            approved_by: userId,
            approved_at: new Date().toISOString(),
          },
          { onConflict: "user_id,step" },
        );
    }
    return { ok: true };
  });

export const setStudentStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ studentId: z.string().uuid(), step: z.number().int().min(1).max(7) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ current_step: data.step })
      .eq("id", data.studentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ studentId: z.string().uuid(), step: z.number().int().min(1).max(7) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // get agency
    const { data: prof } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (!prof?.agency_id) throw new Error("Student not found");
    const { error } = await supabase.from("step_progress").upsert(
      {
        user_id: data.studentId,
        agency_id: prof.agency_id,
        step: data.step,
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      },
      { onConflict: "user_id,step" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
