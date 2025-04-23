// app/layout.js
"use client"; // Marchez acest fișier ca Client Component

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
