import { HexclaveShell } from "@/components/HexclaveShell";

export default function HandlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HexclaveShell>{children}</HexclaveShell>;
}
