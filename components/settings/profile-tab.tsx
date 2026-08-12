"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarBadge } from "@/components/task/avatar-badge";
import { updateProfileAction } from "@/lib/actions/settings";

export function ProfileTab({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string | null;
  email: string;
}) {
  const [name, setName] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      const result = await updateProfileAction({ fullName: name.trim(), phone: phoneValue.trim() });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated");
    });
  }

  return (
    <Card className="max-w-lg space-y-5 p-6">
      <div className="flex items-center gap-4">
        <AvatarBadge name={fullName} size="md" />
        <div>
          <p className="font-medium">{fullName}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full-name">Full name</Label>
        <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} placeholder="Optional" />
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </Card>
  );
}
