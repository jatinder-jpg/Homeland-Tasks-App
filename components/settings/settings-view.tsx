"use client";

import { useState } from "react";
import { User, Building2, Shield, CreditCard, Users2, Handshake, Wrench, ListPlus } from "lucide-react";
import { ProfileTab } from "@/components/settings/profile-tab";
import { OrganizationTab } from "@/components/settings/organization-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { BillingTab } from "@/components/settings/billing-tab";
import { TeamsTab } from "@/components/settings/teams-tab";
import { ClientsTab } from "@/components/settings/clients-tab";
import { ServicesTab } from "@/components/settings/services-tab";
import { CustomFieldsTab } from "@/components/settings/custom-fields-tab";
import type { Database } from "@/lib/types/database.types";

type Organization = Database["public"]["Tables"]["tp_organizations"]["Row"];

type TabKey =
  | "profile"
  | "organization"
  | "teams"
  | "clients"
  | "services"
  | "customFields"
  | "security"
  | "billing";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "organization", label: "Organization", icon: Building2 },
  { key: "teams", label: "Teams", icon: Users2 },
  { key: "clients", label: "Clients", icon: Handshake },
  { key: "services", label: "Services", icon: Wrench },
  { key: "customFields", label: "Custom Fields", icon: ListPlus },
  { key: "security", label: "Security", icon: Shield },
  { key: "billing", label: "Billing", icon: CreditCard },
];

export function SettingsView({
  fullName,
  phone,
  email,
  organization,
  isAdmin,
  isSuperAdmin,
  storageUsageBytes,
}: {
  fullName: string;
  phone: string | null;
  email: string;
  organization: Organization;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  storageUsageBytes: number;
}) {
  const [tab, setTab] = useState<TabKey>("profile");

  return (
    <div className="flex h-full min-w-0">
      <div className="flex w-56 shrink-0 flex-col gap-1 border-r p-4">
        <h1 className="mb-2 text-lg font-bold">Settings</h1>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
              tab === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1 p-6">
        {tab === "profile" && <ProfileTab fullName={fullName} phone={phone} email={email} />}
        {tab === "organization" && <OrganizationTab organization={organization} isSuperAdmin={isSuperAdmin} />}
        {tab === "teams" && <TeamsTab isAdmin={isAdmin} />}
        {tab === "clients" && <ClientsTab isAdmin={isAdmin} />}
        {tab === "services" && <ServicesTab isAdmin={isAdmin} />}
        {tab === "customFields" && <CustomFieldsTab isAdmin={isAdmin} />}
        {tab === "security" && <SecurityTab />}
        {tab === "billing" && <BillingTab storageUsageBytes={storageUsageBytes} />}
      </div>
    </div>
  );
}
