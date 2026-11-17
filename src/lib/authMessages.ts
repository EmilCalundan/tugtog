// Mga mensahe ng login at sign up sa Tagalog, mula sa error ng Supabase.

type AuthErrorLike = { code?: string; message?: string };

const BY_CODE: Record<string, string> = {
  invalid_credentials: "Mali ang email o password.",
  email_not_confirmed: "Hindi pa na-confirm ang email mo. Buksan ang email na ipinadala namin at i-confirm muna.",
  user_already_exists: "May account na ang email na ito. Mag-login na lang.",
  email_exists: "May account na ang email na ito. Mag-login na lang.",
  weak_password: "Masyadong maikli ang password. Gumamit ng hindi bababa sa 6 na letra o numero.",
  over_email_send_rate_limit: "Masyadong maraming email ang naipadala. Maghintay nang ilang minuto at subukan ulit.",
  over_request_rate_limit: "Masyadong maraming subok. Maghintay nang ilang minuto at subukan ulit.",
  email_address_invalid: "Mukhang mali ang email. Pakitingnan ulit.",
  same_password: "Kapareho ito ng dati mong password. Gumamit ng bago.",
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
  return match ? BY_CODE[match[1]] : "May nagkaproblema. Subukan ulit mamaya.";
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
