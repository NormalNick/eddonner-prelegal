"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type User } from "./api";

export interface UseAuth {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

/** Loads the current session via /api/auth/me on mount and exposes a
 * logout helper. 401 is treated as "logged out", not an error. */
export function useAuth(): UseAuth {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return { user, loading, logout };
}
