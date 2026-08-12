"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationAction } from "@/lib/actions/settings";
import type { Database } from "@/lib/types/database.types";

type Organization = Database["public"]["Tables"]["tp_organizations"]["Row"];

export function OrganizationTab({
  organization,
  isAdmin,
}: {
  organization: Organization;
  isAdmin: boolean;
}) {
  const [name, setName] = useState(organization.name);
  const [address, setAddress] = useState(organization.address ?? "");
  const [country, setCountry] = useState(organization.country ?? "");
  const [phone, setPhone] = useState(organization.phone ?? "");
  const [billingEmail, setBillingEmail] = useState(organization.billing_email ?? "");
  const [gstNumber, setGstNumber] = useState(organization.gst_number ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    startTransition(async () => {
      const result = await updateOrganizationAction({
        name: name.trim(),
        address: address.trim(),
        country: country.trim(),
        phone: phone.trim(),
        billingEmail: billingEmail.trim(),
        gstNumber: gstNumber.trim(),
      });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Organization updated");
    });
  }

  const fields: { label: string; value: string; onChange: (v: string) => void }[] = [
    { label: "Organization name", value: name, onChange: setName },
    { label: "Address", value: address, onChange: setAddress },
    { label: "Country", value: country, onChange: setCountry },
    { label: "Phone", value: phone, onChange: setPhone },
    { label: "Billing email", value: billingEmail, onChange: setBillingEmail },
    { label: "GST number", value: gstNumber, onChange: setGstNumber },
  ];

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div className="space-y-1.5">
        <Label>Organization code</Label>
        <Input value={organization.code} disabled />
      </div>

      {fields.map((field) => (
        <div key={field.label} className="space-y-1.5">
          <Label>{field.label}</Label>
          <Input
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={!isAdmin}
          />
        </div>
      ))}

      {isAdmin ? (
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Only workspace admins can edit organization details.</p>
      )}
    </Card>
  );
}
