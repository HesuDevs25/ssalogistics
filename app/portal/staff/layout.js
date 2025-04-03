"use client";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  UsersIcon, 
  DocumentCheckIcon, 
  UserPlusIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StaffLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/portal/staff', icon: HomeIcon },
    { name: 'Document Verification', href: '/portal/staff/documents', icon: DocumentCheckIcon },
    { name: 'Agents', href: '/portal/staff/agents', icon: UsersIcon },
    { name: 'Activation Requests', href: '/portal/staff/activation-requests', icon: UserPlusIcon },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/portal');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 transform transition-transform duration-200 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 bg-blue-800">
            <span className="text-xl font-bold text-white">Staff Portal</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-blue-800">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-blue-100 rounded-md hover:bg-blue-800"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button - Only visible when sidebar is closed */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-900 text-white transition-opacity duration-200 ${
          isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className={`transition-margin duration-200 ease-in-out ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 