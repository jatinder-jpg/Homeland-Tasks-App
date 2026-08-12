"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(input: { fullName: string; phone?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tp_profiles")
    .update({ full_name: input.fullName, phone: input.phone || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export type OrganizationInput = {
  name: string;
  address?: string;
  country?: string;
  phone?: string;
  billingEmail?: string;
  gstNumber?: string;
};

export async function updateOrganizationAction(input: OrganizationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("tp_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const { error } = await supabase
    .from("tp_organizations")
    .update({
      name: input.name,
      address: input.address || null,
      country: input.country || null,
      phone: input.phone || null,
      billing_email: input.billingEmail || null,
      gst_number: input.gstNumber || null,
    })
    .eq("id", profile.organization_id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function changePasswordAction(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}
