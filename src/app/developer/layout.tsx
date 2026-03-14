import { DeveloperShell } from "@/components/developer/developer-shell";

export const dynamic = "force-dynamic";

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperShell>{children}</DeveloperShell>;
}
