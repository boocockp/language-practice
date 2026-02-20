import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export type AuthContextValue = {
  user: Doc<"users"> | null;
  isLoading: boolean;
  signIn: (provider: string, formData: FormData) => Promise<void>;
  signOut: () => Promise<void>;
};

// Exported for test wrappers (MockAuthProvider in test-utils)
// eslint-disable-next-line react-refresh/only-export-components -- test support
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.currentUser);
  const { signIn: authSignIn, signOut: authSignOut } = useAuthActions();

  const signIn = useCallback(
    async (provider: string, formData: FormData) => {
      await authSignIn(provider, formData);
    },
    [authSignIn],
  );

  const signOut = useCallback(async () => {
    await authSignOut();
  }, [authSignOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: user === undefined,
      signIn,
      signOut,
    }),
    [user, signIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// Context + hook pattern: Fast Refresh expects only components, but hooks are commonly co-located
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
