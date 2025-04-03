"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error('Auth error:', error);
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
        await fetchCars(user.id);
        await fetchDocuments(user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchCars = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
        return;
      }
      
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchDocuments = async (userId) => {
    if (!userId) return;
    
    try {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

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

  // Calculate document statistics
  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter(doc => doc.status === 'verified').length;
  const pendingDocuments = documents.filter(doc => doc.status === 'pending').length;
  const rejectedDocuments = documents.filter(doc => doc.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Account Status Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Account Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                <div className="mt-4 space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Name:</span> {user?.profile?.name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Account Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      user?.profile?.account_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user?.profile?.account_status?.charAt(0).toUpperCase() + user?.profile?.account_status?.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Document Statistics</h3>
                <div className="mt-4 space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Total Documents:</span> {totalDocuments}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Verified:</span> {verifiedDocuments}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Pending:</span> {pendingDocuments}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Rejected:</span> {rejectedDocuments}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cars Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Your Cars</h2>
              <Link
                href="/portal/dashboard/documents"
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
              >
                Manage Documents
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <Link
                  key={car.id}
                  href={`/portal/dashboard/documents/${car.id}`}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-colors duration-200"
                >
                  <h3 className="font-medium text-gray-900">Chassis Number</h3>
                  <p className="text-gray-600">{car.chassis_number}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    {documents.filter(doc => doc.car_id === car.id).length} documents
                  </div>
                </Link>
              ))}
            </div>
            {cars.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No cars added yet</p>
                <Link
                  href="/portal/dashboard/documents"
                  className="mt-4 inline-block px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
                >
                  Add Your First Car
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/portal/dashboard/documents"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-colors duration-200 text-center"
              >
                <svg className="w-8 h-8 mx-auto text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 font-medium text-gray-900">Manage Documents</p>
              </Link>
              <Link
                href="/portal/dashboard/profile"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-colors duration-200 text-center"
              >
                <svg className="w-8 h-8 mx-auto text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="mt-2 font-medium text-gray-900">Profile Settings</p>
              </Link>
              <Link
                href="/portal/dashboard/status"
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-colors duration-200 text-center"
              >
                <svg className="w-8 h-8 mx-auto text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 font-medium text-gray-900">Check Status</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 