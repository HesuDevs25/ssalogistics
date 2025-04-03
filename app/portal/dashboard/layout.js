"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // Skip auth check if we're logging out
      if (isLoggingOut) return;

      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // If there's no user or error, redirect to portal
        if (error || !user) {
          router.push('/portal');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          router.push('/portal');
          return;
        }

        setUser({ ...user, profile });
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, isLoggingOut]);

  const handleLogout = async () => {
    try {
      if (!window.confirm('Are you sure you want to logout?')) {
        return;
      }

      setIsLoggingOut(true);
      setIsLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
        return;
      }
      
      // Clear local state
      setUser(null);
      
      // Use window.location instead of router to force a full page reload
      window.location.href = '/portal';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoggingOut(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we're logging out, show a simple loading state
  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Logging out...</p>
        </div>
      </div>
    );
  }

  const canAccessDocuments = user?.profile?.account_status === 'active';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">Document Portal Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.profile?.name || 'User'}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              href="/portal/dashboard"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                pathname === '/portal/dashboard'
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Home
            </Link>
            <Link
              href="/portal/dashboard/documents"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                pathname === '/portal/dashboard/documents'
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } ${
                !canAccessDocuments 
                  ? "opacity-50 cursor-not-allowed relative group" 
                  : "cursor-pointer"
              } whitespace-nowrap`}
              onClick={(e) => {
                if (!canAccessDocuments) {
                  e.preventDefault();
                }
              }}
            >
              Documents
              {!canAccessDocuments && (
                <>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Locked
                  </span>
                  <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-24 w-52 bg-gray-800 text-white text-xs rounded py-2 px-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <p className="text-center whitespace-normal">
                      This section requires account activation first. Visit profile tab to activate.
                    </p>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </>
              )}
            </Link>
            <Link
              href="/portal/dashboard/status"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                pathname === '/portal/dashboard/status'
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Status
            </Link>
            <Link
              href="/portal/dashboard/profile"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                pathname === '/portal/dashboard/profile'
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  );
} 