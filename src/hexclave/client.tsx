import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    default: {
      type: "hosted",
    },
    home: "/personas",
    afterSignIn: "/personas",
    afterSignUp: "/age-gate",
    afterSignOut: "/",
  },
});
