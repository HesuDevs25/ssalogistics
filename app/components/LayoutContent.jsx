"use client";

import { usePathname } from 'next/navigation';
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isPortalRoute = pathname?.startsWith('/portal');

  return (
    <>
      {!isPortalRoute && <Navbar />}
      <main className={!isPortalRoute ? "pt-16" : ""}>
        {children}
      </main>
      {!isPortalRoute && <Footer />}
    </>
  );
} 