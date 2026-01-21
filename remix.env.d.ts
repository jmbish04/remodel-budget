/// <reference types="@remix-run/dev" />
/// <reference types="@cloudflare/workers-types/2024-09-23" />

interface Env {
  DB: D1Database;
  AI: Ai;
}
