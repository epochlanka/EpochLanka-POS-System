import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionExpiry } from "@/lib/session";
import { User } from "@prisma/client";

const BCRYPT_SALT_ROUNDS = 10;

export interface RegisterUserData {
  email: string;
  name: string;
  password: string;
  roleId: string;
  branchId?: string | null;
}

export interface LoginResponse {
  user: Omit<User, "passwordHash">;
  sessionId: string;
}

/**
 * Thrown for any auth failure that is safe to show to the end user
 * (wrong credentials, inactive account, expired session, etc).
 * Kept distinct from unexpected/internal errors so API routes can
 * respond with 401 instead of 500.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function omitPasswordHash(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}

/**
 * Service to handle user authentication, registration, permissions, and management.
 */
export const authService = {
  /**
   * Registers a new user in the database. Emails are stored lowercased so
   * lookups/uniqueness checks are case-insensitive.
   */
  async registerUser(data: RegisterUserData): Promise<User> {
    const email = data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    return prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        roleId: data.roleId,
        branchId: data.branchId ?? null,
      },
    });
  },

  /**
   * Logs in a user using email and password, returning user data and a session identifier.
   */
  async loginUser(email: string, password: string): Promise<LoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Same generic error whether the email doesn't exist or the password is
    // wrong, so we don't leak which emails are registered.
    if (!user) {
      throw new AuthError("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new AuthError("This account has been deactivated. Contact your administrator.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthError("Invalid email or password.");
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: getSessionExpiry(),
      },
    });

    return {
      user: omitPasswordHash(user),
      sessionId: session.id,
    };
  },

  /**
   * Invalidates a session and logs out the user.
   */
  async logoutUser(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
      return true;
    } catch {
      // Session was already gone (expired cleanup, double logout, etc) —
      // logging out is idempotent from the caller's point of view.
      return false;
    }
  },

  /**
   * Retrieves the current user associated with a session ID.
   * Returns null (rather than throwing) for a missing/expired session so
   * callers can treat it as "not logged in" without a try/catch.
   */
  async getCurrentUser(sessionId: string): Promise<Omit<User, "passwordHash"> | null> {
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      // Lazily clean up the expired session.
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      return null;
    }

    if (!session.user.isActive) return null;

    return omitPasswordHash(session.user);
  },

  /**
   * Checks if a user has a specific permission based on their assigned role.
   * Permissions are stored as a flat JSON map on Role, e.g.
   * { "products.create": true, "reports.view": true }.
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) return false;

    const permissions = user.role.permissions as Record<string, boolean>;
    return permissions?.[permission] === true;
  },

  /**
   * Returns the full permission map for a user's role (e.g. for populating
   * client-side UI gating without a round trip per permission).
   */
  async getPermissions(userId: string): Promise<Record<string, boolean>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) return {};
    return (user.role.permissions as Record<string, boolean>) ?? {};
  },

  /**
   * Changes the user's password after validating their old password.
   * Also revokes every other active session for the user, so a
   * compromised session can't outlive a password change.
   */
  async changePassword(
    userId: string,
    oldPass: string,
    newPass: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthError("User not found.");
    }

    const oldPasswordMatches = await bcrypt.compare(oldPass, user.passwordHash);
    if (!oldPasswordMatches) {
      throw new AuthError("Current password is incorrect.");
    }

    const passwordHash = await bcrypt.hash(newPass, BCRYPT_SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);

    return true;
  },
};
