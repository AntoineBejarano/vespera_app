/**
 * Post-auth should land on /auth/continue (cookie + age-gate), not the page
 * the user signed in from. Hexclave's default redirect-back sets
 * after_auth_return_to to the current URL (often `/`), which flashes the
 * marketing landing after login.
 *
 * `noRedirectBack: true` skips that and uses urls.afterSignIn / afterSignUp.
 */
export function redirectToAppSignIn(app: {
  redirectToSignIn: (options?: { noRedirectBack?: boolean }) => Promise<void>;
}) {
  return app.redirectToSignIn({ noRedirectBack: true });
}

export function redirectToAppSignUp(app: {
  redirectToSignUp: (options?: { noRedirectBack?: boolean }) => Promise<void>;
}) {
  return app.redirectToSignUp({ noRedirectBack: true });
}
