import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/admin-console";

// The office console for the store admin, marketing and the owner's office. The console itself is a client component
// (components/admin): it reads the signed-in session and picks its section from the URL hash.

export const metadata: Metadata = {
  title: "Office console",
};

export default function AdminPage() {
  return <AdminConsole />;
}
