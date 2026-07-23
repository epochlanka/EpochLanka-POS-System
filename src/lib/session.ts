/**
 * Shared constants for cookie-based, database-backed sessions.
 *
 * Sessions are opaque IDs stored in the `Session` table (see prisma schema).
 * The cookie only ever holds the session id — never user data — so the
 * server is always the source of truth and a session can be revoked
 * instantly (logout, password change, admin deactivation) by deleting the row.
 */
export const SESSION_COOKIE_NAME = "epoch_session";

/** How long a session stays valid for, in seconds (7 days). */
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
}