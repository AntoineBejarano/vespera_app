import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/hexclave/server";

/** Auth-capable shell — Hexclave (and Stripe) stay off the bare marketing homepage. */
export default function HexclaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HexclaveProvider app={hexclaveServerApp}>
      <HexclaveTheme>{children}</HexclaveTheme>
    </HexclaveProvider>
  );
}
