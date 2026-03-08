"use client";

const KEY = "valor_user_id";

function fallbackId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `user_${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateClientUserId() {
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const next = fallbackId();
  window.localStorage.setItem(KEY, next);
  return next;
}

export function setClientUserId(userId: string) {
  window.localStorage.setItem(KEY, userId);
}
