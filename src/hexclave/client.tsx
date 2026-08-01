import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    // Same-domain /handler pages — avoids hosted cross-domain OAuth loops.
    default: {
      type: "handler-component",
    },
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    home: "/personas",
    // Single post-auth hop: restore cookie or one age-gate, then destination.
    afterSignIn: "/auth/continue",
    afterSignUp: "/auth/continue",
    afterSignOut: "/",
  },
});
