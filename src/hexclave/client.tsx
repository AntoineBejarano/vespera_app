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
    afterSignIn: "/personas",
    afterSignUp: "/age-gate?zone=standard",
    afterSignOut: "/",
  },
});
