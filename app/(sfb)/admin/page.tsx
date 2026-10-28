import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/admin-console";

// Ported from admin/index.html; the console itself is a client component (components/admin), as admin.js ran in the page.

export const metadata: Metadata = {
  title: "Store admin",
};

export default function AdminPage() {
  return <AdminConsole />;
}
