"use client"

import Interface from "../app/_components/interface"
import { SessionProvider } from "next-auth/react";

export default function Home() {

  
  return (
    <SessionProvider>
    <main>

      <Interface />
    </main>
    </SessionProvider>
  );
}
