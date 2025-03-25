import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function PortalLayout({ children }) {
  return (
    <div className={`${geistSans.variable} min-h-screen bg-gray-100`}>
      {children}
    </div>
  );
} 