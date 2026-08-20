"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { pingPresenceAction, getPresenceMapAction } from "@/lib/actions/presence";

const HEARTBEAT_MS = 20_000;
const REFRESH_MS = 15_000;
const ONLINE_THRESHOLD_MS = 45_000;
const IDLE_THRESHOLD_MS = 5 * 60_000;

export type PresenceStatus = "online" | "idle" | "offline";

const PresenceContext = createContext<Map<string, string>>(new Map());

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [lastSeenByProfile, setLastSeenByProfile] = useState<Map<string, string>>(new Map());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    function heartbeat() {
      if (document.visibilityState === "visible") pingPresenceAction();
    }
    heartbeat();
    const heartbeatId = setInterval(heartbeat, HEARTBEAT_MS);

    function refresh() {
      getPresenceMapAction().then((entries) => {
        if (!mountedRef.current) return;
        setLastSeenByProfile(new Map(entries.map((e) => [e.profileId, e.lastSeenAt])));
      });
    }
    refresh();
    const refreshId = setInterval(refresh, REFRESH_MS);

    document.addEventListener("visibilitychange", heartbeat);

    return () => {
      mountedRef.current = false;
      clearInterval(heartbeatId);
      clearInterval(refreshId);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, []);

  return <PresenceContext.Provider value={lastSeenByProfile}>{children}</PresenceContext.Provider>;
}

export function usePresenceStatus(profileId: string | null | undefined): PresenceStatus | null {
  const lastSeenByProfile = useContext(PresenceContext);
  if (!profileId) return null;
  const lastSeenAt = lastSeenByProfile.get(profileId);
  if (!lastSeenAt) return null;

  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed <= ONLINE_THRESHOLD_MS) return "online";
  if (elapsed <= IDLE_THRESHOLD_MS) return "idle";
  return "offline";
}
