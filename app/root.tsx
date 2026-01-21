import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import stylesheet from "~/styles/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export default function App() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-muted/40">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm font-medium">
            <span className="text-base font-semibold text-foreground">
              126 Colby St Renovation
            </span>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a className="hover:text-foreground" href="/">
                Contractor Bid
              </a>
              <a className="hover:text-foreground" href="/owner">
                Owner Dashboard
              </a>
              <a className="hover:text-foreground" href="/compare">
                Scenario Compare
              </a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
