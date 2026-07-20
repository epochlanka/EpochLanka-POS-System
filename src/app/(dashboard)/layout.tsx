import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { AuthProvider } from "@/lib/auth-context";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionId ? await authService.getCurrentUser(sessionId) : null;

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        branchId: user.branchId,
        isActive: user.isActive,
      }}
    >
      {children}
    </AuthProvider>
  );
}
