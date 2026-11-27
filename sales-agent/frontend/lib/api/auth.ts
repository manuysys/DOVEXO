import { apiRequest } from "./client";
import { normalizeUser } from "./normalize";
import type { LoginInput, User } from "./types";

export async function login(input: LoginInput): Promise<User | null> {
  const payload = await apiRequest<unknown>("/auth/login", {
    method: "POST",
    body: { email: input.email, password: input.password },
  });
  if (payload === null) return null;
  const user = normalizeUser(payload);
  return user.email ? user : null;
}

export async function getCurrentUser(): Promise<User> {
  const payload = await apiRequest<unknown>("/auth/me");
  return normalizeUser(payload);
}

export async function logout(): Promise<void> {
  await apiRequest<unknown>("/auth/logout", { method: "POST" });
}
