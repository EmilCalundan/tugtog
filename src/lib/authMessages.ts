// Mga mensahe ng login at sign up sa English, mula sa error ng Supabase.

type AuthErrorLike = { code?: string; message?: string };

const BY_CODE: Record<string, string> = {
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed: "Your email is not confirmed yet. Open the email we sent and confirm it first.",
  user_already_exists: "This email already has an account. Log in instead.",
  email_exists: "This email already has an account. Log in instead.",
  weak_password: "The password is too short. Use at least 6 letters or numbers.",
  over_email_send_rate_limit: "Too many emails were sent. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many tries. Wait a few minutes and try again.",
  email_address_invalid: "That email looks wrong. Please check it again.",
  same_password: "This is the same as your old password. Use a new one.",
};

// Para sa mga lumang error na walang code
const BY_MESSAGE: [RegExp, string][] = [
  [/invalid login credentials/i, "invalid_credentials"],
  [/email not confirmed/i, "email_not_confirmed"],
  [/already registered/i, "user_already_exists"],
  [/at least 6 characters/i, "weak_password"],
  [/rate limit/i, "over_email_send_rate_limit"],
];

export function authErrorMessage(error: AuthErrorLike): string {
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  const match = BY_MESSAGE.find(([pattern]) => pattern.test(error.message ?? ""));
  return match ? BY_CODE[match[1]] : "Something went wrong. Try again later.";
}

// Ano ang nangyari pagkatapos ng sign up?
// Kapag naka-on ang Confirm email, walang session hangga't hindi na-confirm.
// Kapag may account na ang email, walang identities (itinatago ito ng Supabase para sa privacy).
export function signUpOutcome(data: {
  session: unknown | null;
  user: { identities?: unknown[] | null } | null;
}): "logged-in" | "check-email" | "already-registered" {
  if (data.session) return "logged-in";
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return "already-registered";
  return "check-email";
}
