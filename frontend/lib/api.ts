/**
 * Tiny fetch wrapper for the backend API. Always sends cookies so the
 * signed-session cookie flows on every call.
 */

import type { NdaFormData, NdaParty } from "./nda-types";

export interface User {
  id: number;
  email: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type NdaPartyPatch = Partial<NdaParty>;

export interface NdaFieldsPatch {
  purpose?: string | null;
  effectiveDate?: string | null;
  ndaTermKind?: "years" | "untilTerminated" | null;
  ndaTermYears?: number | null;
  confidentialityKind?: "years" | "perpetuity" | null;
  confidentialityYears?: number | null;
  governingLawState?: string | null;
  jurisdiction?: string | null;
  modifications?: string | null;
  party1?: NdaPartyPatch | null;
  party2?: NdaPartyPatch | null;
}

export interface ChatResponse {
  reply: string;
  fieldsPatch: NdaFieldsPatch;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return body as T;
}

export const api = {
  signup: (email: string, password: string) =>
    request<User>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),
  chat: (messages: ChatMessage[], currentFields: NdaFormData) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ messages, currentFields }),
    }),
};
