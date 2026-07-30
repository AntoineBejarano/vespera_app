import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    // Hosted auth UI + local /handler catch-all for cookie handoff.
    default: {
      type: "hosted",
    },
    home: "/personas",
    afterSignIn: "/personas",
    afterSignUp: "/age-gate",
    afterSignOut: "/",
  },
});
