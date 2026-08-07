import type { Metadata } from "next";
import { HexclaveShell } from "@/components/HexclaveShell";

export const metadata: Metadata = {
  title: "Access gate",
  robots: { index: false, follow: false },
};

export default function AgeGateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HexclaveShell>{children}</HexclaveShell>;
}
