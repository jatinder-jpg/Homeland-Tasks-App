"use client";

import { useState } from "react";
import { User, Building2, Shield, CreditCard, Users2, Handshake, Wrench, ListPlus } from "lucide-react";
import { ProfileTab } from "@/components/settings/profile-tab";
import { OrganizationTab } from "@/components/settings/organization-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { BillingTab } from "@/components/settings/billing-tab";
import { DepartmentsTab } from "@/components/settings/departments-tab";
import { ClientsTab } from "@/components/settings/clients-tab";
import { ServicesTab } from "@/components/settings/services-tab";
import { CustomFieldsTab } from "@/components/settings/custom-fields-tab";
import type { Database } from "@/lib/types/database.types";

type Organization = Database["public"]["Tables"]["tp_organizations"]["Row"];

type TabKey =
  | "profile"
  | "organization"
  | "departments"
  | "clients"
  | "services"
  | "customFields"
  | "security"
  | "billing";

type Visibility = "all" | "admin" | "superAdmin";

const TABS: { key: TabKey; label: string; icon: typeof User; visibility: Visibility }[] = [
  { key: "profile", label: "Profile", icon: User, visibility: "all" },
  { key: "organization", label: "Organization", icon: Building2, visibility: "superAdmin" },
  { key: "departments", label: "Departments", icon: Users2, visibility: "admin" },
  { key: "clients", label: "Clients", icon: Handshake, visibility: "superAdmin" },
  { key: "services", label: "Services", icon: Wrench, visibility: "superAdmin" },
  { key: "customFields", label: "Custom Fields", icon: ListPlus, visibility: "superAdmin" },
  { key: "security", label: "Security", icon: Shield, visibility: "all" },
  { key: "billing", label: "Billing", icon: CreditCard, visibility: "superAdmin" },
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
  const visibleTabs = TABS.filter((t) => {
    if (t.visibility === "all") return true;
    if (t.visibility === "admin") return isAdmin;
    return isSuperAdmin;
  });

  return (
    <div className="flex h-full min-w-0">
      <div className="flex w-56 shrink-0 flex-col gap-1 border-r p-4">
        <h1 className="mb-2 text-lg font-bold">Settings</h1>
        {visibleTabs.map(({ key, label, icon: Icon }) => (
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
        {tab === "organization" && isSuperAdmin && (
          <OrganizationTab organization={organization} isSuperAdmin={isSuperAdmin} />
        )}
        {tab === "departments" && isAdmin && <DepartmentsTab isAdmin={isAdmin} />}
        {tab === "clients" && isSuperAdmin && <ClientsTab isAdmin={isAdmin} />}
        {tab === "services" && isSuperAdmin && <ServicesTab isAdmin={isAdmin} />}
        {tab === "customFields" && isSuperAdmin && <CustomFieldsTab isAdmin={isAdmin} />}
        {tab === "security" && <SecurityTab />}
        {tab === "billing" && isSuperAdmin && <BillingTab storageUsageBytes={storageUsageBytes} />}
      </div>
    </div>
  );
}
