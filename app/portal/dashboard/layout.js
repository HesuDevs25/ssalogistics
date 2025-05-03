"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    HomeIcon,
    TruckIcon,
    UserCircleIcon,
    DocumentTextIcon, // Main Invoice Icon
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon, // For expanding menu
    DocumentDuplicateIcon, // For My Invoices
    PlusCircleIcon // For Request Invoice
 } from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false); // State for invoice menu

  useEffect(() => {
    // Reset invoice menu state on route change if needed, or keep it open
    // setIsInvoiceOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkUser = async () => {
      if (isLoggingOut) return;
      setIsLoading(true); // Ensure loading state is true at the start
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error('Auth error:', error?.message || 'No user found');
          router.push('/portal');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Profile fetch warning:', profileError.message); // Warn instead of error
          setUser({ ...user, profile: null }); // Allow access even if profile fails
        } else {
          setUser({ ...user, profile });
        }

      } catch (error) {
        console.error('Auth check error:', error.message);
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
      if (error) throw error;
      setUser(null);
      window.location.href = '/portal';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
      setIsLoading(false); // Reset loading states on error
      setIsLoggingOut(false);
    }
    // No finally needed here as redirect happens on success
  };

  // Loading states
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-dark)]">Loading...</p>
        </div>
      </div>
    );
  }
  if (isLoggingOut) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="mt-4 text-[var(--text-dark)]">Logging out...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { name: 'Home', href: '/portal/dashboard', icon: HomeIcon },
    { name: 'Vehicles', href: '/portal/dashboard/vehicles', icon: TruckIcon },
    {
        name: 'Invoices',
        icon: DocumentTextIcon,
        isOpen: isInvoiceOpen,
        setIsOpen: setIsInvoiceOpen,
        subItems: [
            { name: 'My Invoices', href: '/portal/dashboard/invoices/my-invoices', icon: DocumentDuplicateIcon },
            { name: 'Request Invoice', href: '/portal/dashboard/invoices/request', icon: PlusCircleIcon },
        ]
    },
    { name: 'Profile', href: '/portal/dashboard/profile', icon: UserCircleIcon },
  ];

  return (
    // Added overflow-hidden to the root flex container to prevent scrollbars
    <div className="min-h-screen flex bg-[var(--background-light)] overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--background-dark)] text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--primary-light)] md:justify-center flex-shrink-0">
           <h1 className="text-xl font-bold">SSA Logistics</h1>
           <button
             onClick={() => setIsSidebarOpen(false)}
             className="text-[var(--accent-light)] hover:text-white md:hidden"
             aria-label="Close sidebar"
           >
             <XMarkIcon className="h-6 w-6" />
           </button>
        </div>
        {/* Sidebar Navigation (Scrollable) */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            item.subItems ? (
              // Render Expandable Menu Item
              <div key={item.name}>
                <button
                  onClick={() => item.setIsOpen(!item.isOpen)}
                  className={`group w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${ 
                    pathname.startsWith('/portal/dashboard/invoices') // Highlight if path starts with /invoices
                      ? 'bg-[var(--primary)] text-white' 
                      : 'text-gray-100 hover:bg-[var(--primary-light)] hover:text-white'
                  }`}
                >
                  <span className="flex items-center">
                     <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-[var(--accent-light)]" aria-hidden="true" />
                     {item.name}
                  </span>
                  <ChevronDownIcon className={`w-5 h-5 text-[var(--accent-light)] transform transition-transform duration-150 ${item.isOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* Conditionally Render Sub Items */}
                {item.isOpen && (
                  <div className="mt-1 space-y-1 pl-5">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={() => setIsSidebarOpen(false)} // Close mobile sidebar on sub-item click
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${ 
                            pathname === subItem.href 
                            ? 'bg-[var(--primary-light)] text-white' 
                            : 'text-gray-200 hover:bg-[var(--primary-light)] hover:text-white' 
                        }`}
                      >
                        <subItem.icon className="mr-3 flex-shrink-0 h-5 w-5 text-[var(--accent-light)]" aria-hidden="true" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Render Regular Link Item
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${ 
                    pathname === item.href 
                    ? 'bg-[var(--primary)] text-white' 
                    : 'text-gray-100 hover:bg-[var(--primary-light)] hover:text-white' 
                }`}
              >
                <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-[var(--accent-light)]" aria-hidden="true" />
                {item.name}
              </Link>
            )
          ))}
        </nav>
         {/* Sidebar Footer */}
         <div className="mt-auto p-4 border-t border-[var(--primary-light)] flex-shrink-0">
           <button
              onClick={handleLogout}
              className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-100 hover:bg-[var(--primary-light)] hover:text-white"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-[var(--accent-light)]" aria-hidden="true" />
              Logout
           </button>
         </div>
      </div>

       {/* Mobile overlay for sidebar */}
       {isSidebarOpen && (
         <div
           className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
           onClick={() => setIsSidebarOpen(false)}
           aria-hidden="true"
         ></div>
       )}

      {/* Main Content Area */}
      {/* flex-1 ensures it takes remaining space, overflow-hidden prevents its own scroll issues */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10 flex-shrink-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"> {/* Added max-width */}
            <div className="flex justify-between items-center h-16">
               {/* Hamburger Menu Button - Mobile */}
               <button
                 onClick={() => setIsSidebarOpen(true)}
                 className="text-[var(--text-dark)] hover:text-[var(--primary)] md:hidden"
                 aria-label="Open sidebar"
               >
                 <Bars3Icon className="h-6 w-6" />
               </button>

              {/* Invisible placeholder to balance the hamburger menu */}
               <div className="md:hidden">&nbsp;</div>

              {/* User Info - Moved to top right */}
              <div className="flex items-center">
                <span className="text-sm md:text-base text-[var(--text-dark)] truncate px-2">
                   Welcome, {user?.profile?.name || user?.email || 'User'}
                </span>
                {/* Logout Button - Hidden on Desktop, handled in sidebar */}
                <button
                  onClick={handleLogout}
                  className="ml-2 flex-shrink-0 flex items-center px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] rounded-md hover:bg-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-light)] transition-colors duration-200 md:hidden"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* This div must be scrollable to contain the main content */}
        <main className="flex-1 overflow-y-auto bg-[var(--background-light)]">
          {/* Content Container with padding and max-width */}
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer - Optional */}
        <footer className="bg-white border-t border-[var(--background-light)] py-4 px-4 flex-shrink-0">
          <div className="container mx-auto flex justify-between items-center text-sm text-[var(--text-dark)] max-w-7xl">
            <p>© {new Date().getFullYear()} SSA Logistics</p>
            <div className="flex space-x-4">
              <Link href="/terms" className="hover:text-[var(--primary)]">Terms</Link>
              <Link href="/privacy" className="hover:text-[var(--primary)]">Privacy</Link>
              <Link href="/contact" className="hover:text-[var(--primary)]">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 