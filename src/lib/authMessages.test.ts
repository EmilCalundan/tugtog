import { describe, it, expect } from "vitest";
import { authErrorMessage, signUpOutcome } from "./authMessages";

describe("authErrorMessage", () => {
  it("maling email o password", () => {
    expect(authErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(
      "Wrong email or password.",
    );
  });

  it("hindi pa na-confirm ang email", () => {
    expect(authErrorMessage({ code: "email_not_confirmed", message: "Email not confirmed" })).toMatch(/confirm/);
  });

  it("gamit na ang email", () => {
    expect(authErrorMessage({ code: "user_already_exists", message: "User already registered" })).toMatch(/already has an account/);
  });

  it("mahinang password", () => {
    expect(authErrorMessage({ code: "weak_password", message: "Password should be at least 6 characters." })).toMatch(/6/);
  });

  it("sobrang daming email", () => {
    expect(authErrorMessage({ code: "over_email_send_rate_limit", message: "email rate limit exceeded" })).toMatch(/Wait/);
  });

  it("walang code: tinitingnan ang mensahe", () => {
    expect(authErrorMessage({ message: "Invalid login credentials" })).toBe("Wrong email or password.");
  });

  it("hindi kilalang error: pangkalahatang mensahe", () => {
    expect(authErrorMessage({ message: "Something odd" })).toBe("Something went wrong. Try again later.");
  });
});

describe("signUpOutcome", () => {
  it("may session: naka-login na agad (naka-off ang Confirm email)", () => {
    expect(signUpOutcome({ session: {}, user: { identities: [{}] } })).toBe("logged-in");
  });

  it("walang session: kailangang i-confirm ang email", () => {
    expect(signUpOutcome({ session: null, user: { identities: [{}] } })).toBe("check-email");
  });

  it("walang identities: may account na ang email na ito", () => {
    expect(signUpOutcome({ session: null, user: { identities: [] } })).toBe("already-registered");
  });
});
