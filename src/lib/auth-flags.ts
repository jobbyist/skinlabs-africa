/**
 * Small, maintainable feature-flag surface for auth methods — deliberately
 * not a full flag service, just a single source of truth so a disabled
 * method can't linger half-removed in some UI while still wired up in
 * another.
 *
 * magicLinkEnabled: false — passwordless sign-in is temporarily disabled
 * site-wide while SMTP delivery issues affect this project's Supabase
 * auth emails. The underlying useAuth().signInWithMagicLink() call is left
 * in place (untouched) so this can be flipped back on the moment SMTP is
 * confirmed stable again — flip this one flag, nothing else.
 */
export const AUTH_FLAGS = {
  magicLinkEnabled: false,
} as const;
