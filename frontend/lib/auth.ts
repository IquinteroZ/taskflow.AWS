// ============================================
// lib/auth.ts — Client-side auth helpers
// ============================================

import Cookies from "js-cookie";

const TOKEN_KEY = "taskflow_token";

export const auth = {
  getToken: (): string | undefined => Cookies.get(TOKEN_KEY),

  setToken: (token: string): void => {
    Cookies.set(TOKEN_KEY, token, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  },

  clearToken: (): void => {
    Cookies.remove(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!Cookies.get(TOKEN_KEY);
  },
};
