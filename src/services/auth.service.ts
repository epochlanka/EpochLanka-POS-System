import { prisma } from "@/lib/prisma";
import { User, Role } from "@prisma/client";

export interface RegisterUserData {
  email: string;
  name: string;
  passwordHash: string;
  roleId: string;
  branchId?: string | null;
}

export interface LoginResponse {
  user: Omit<User, "passwordHash">;
  sessionId: string;
}

/**
 * Service to handle user authentication, registration, permissions, and management.
 */
export const authService = {
  /**
   * Registers a new user in the database.
   */
  async registerUser(data: RegisterUserData): Promise<User> {
    throw new Error("registerUser is not yet implemented.");
  },

  /**
   * Logs in a user using email and password, returning user data and a session identifier.
   */
  async loginUser(email: string, password: string): Promise<LoginResponse> {
    throw new Error("loginUser is not yet implemented.");
  },

  /**
   * Invalidates a session and logs out the user.
   */
  async logoutUser(sessionId: string): Promise<boolean> {
    throw new Error("logoutUser is not yet implemented.");
  },

  /**
   * Retrieves the current user associated with a session ID.
   */
  async getCurrentUser(sessionId: string): Promise<Omit<User, "passwordHash"> | null> {
    throw new Error("getCurrentUser is not yet implemented.");
  },

  /**
   * Checks if a user has a specific permission based on their assigned role.
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    throw new Error("hasPermission is not yet implemented.");
  },

  /**
   * Changes the user's password after validating their old password.
   */
  async changePassword(
    userId: string,
    oldPass: string,
    newPass: string
  ): Promise<boolean> {
    throw new Error("changePassword is not yet implemented.");
  },
};
