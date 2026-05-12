export interface AccountSession {
  id: string;
  deviceName?: string | null;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  lastActiveAt?: string | null;
  createdAt?: string | null;
  isCurrent?: boolean;
  status?: "active" | "revoked";
}
