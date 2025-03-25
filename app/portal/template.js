"use client";

export default function PortalTemplate({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-0">
        {children}
      </main>
    </div>
  );
} 