"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export type ActionResult = { error: string } | { success: true };

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const mode = String(formData.get("mode") ?? "create");
  const orgName = String(formData.get("orgName") ?? "");
  const orgCode = String(formData.get("orgCode") ?? "").trim().toUpperCase();

  const supabase = await createClient();

  if (mode === "join") {
    const { data: orgName2, error: lookupError } = await supabase.rpc(
      "tp_lookup_org_name_by_code",
      { p_code: orgCode },
    );
    if (lookupError || !orgName2) {
      return { error: "That organization code doesn't match any workspace." };
    }
  }

  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data:
        mode === "join"
          ? { full_name: fullName, join_org_code: orgCode }
          : { full_name: fullName, org_name: orgName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled, signUp() returns an active session
  // immediately and /auth/callback never runs — bootstrap the org/profile here.
  if (data.session && data.user) {
    const { data: existingProfile } = await supabase
      .from("tp_profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!existingProfile) {
      if (mode === "join") {
        await supabase.rpc("tp_join_organization", { org_code: orgCode, member_full_name: fullName });
      } else {
        await supabase.rpc("tp_create_organization_and_admin", {
          org_name: orgName,
          admin_full_name: fullName,
        });
      }
    }

    redirect("/dashboard");
  }

  return { success: true };
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
