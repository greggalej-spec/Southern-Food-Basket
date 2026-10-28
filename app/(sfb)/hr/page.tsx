import type { Metadata } from "next";
import { HrConsole } from "@/components/hr/hr-console";

// Ported from hr/index.html; the console itself is a client component (components/hr), as hr.js ran in the page.

export const metadata: Metadata = {
  title: "HR console",
};

export default function HrPage() {
  return <HrConsole />;
}
