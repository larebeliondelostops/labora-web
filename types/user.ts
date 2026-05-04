export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  role: "user" | "admin" | "reviewer";
  email?: string;
}
