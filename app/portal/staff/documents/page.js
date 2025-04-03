"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DocumentVerification() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cars, setCars] = useState([]);

  useEffect(() => {
    checkStaffAccess();
  }, []);

  const checkStaffAccess = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/portal');
        return;
      }

      // Use service role to check staff access
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .eq('role', 'staff');

      if (profileError) {
        console.error('Error checking staff access:', profileError);
        router.push('/portal');
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.error('Not authorized as staff: No staff profile found');
        router.push('/portal');
        return;
      }

      await fetchCarsWithPendingDocuments();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCarsWithPendingDocuments = async () => {
    try {
      // Use service role client to fetch cars with pending documents
      const { data: carsWithDocs, error: carsError } = await supabaseAdmin
        .from('cars')
        .select(`
          id,
          chassis_number,
          created_at,
          user_id,
          documents!inner (
            id,
            status
          )
        `)
        .eq('documents.status', 'pending')
        .order('created_at', { ascending: false });

      if (carsError) throw carsError;

      if (!carsWithDocs || carsWithDocs.length === 0) {
        setCars([]);
        return;
      }

      // Get unique car IDs
      const uniqueCarIds = [...new Set(carsWithDocs.map(car => car.id))];

      // Fetch profiles for these cars using service role
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', carsWithDocs.map(car => car.user_id));

      if (profilesError) throw profilesError;

      // Create a map of user profiles for easy lookup
      const profilesMap = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine car data with profile information
      const carsWithProfiles = carsWithDocs.map(car => {
        const pendingDocs = car.documents.filter(doc => doc.status === 'pending').length;
        return {
          ...car,
          pending_documents: pendingDocs,
          profiles: profilesMap[car.user_id] || { name: 'Unknown', email: 'Unknown' }
        };
      });

      setCars(carsWithProfiles);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setCars([]);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-8">Document Verification</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Link
                key={car.id}
                href={`/portal/staff/documents/${car.id}`}
                className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chassis: {car.chassis_number}
                    </h3>
                    <span className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-full">
                      {car.pending_documents} pending
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Owner:</span> {car.profiles.name || car.profiles.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Added:</span> {new Date(car.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center text-blue-600">
                    <span className="text-sm font-medium">View Documents</span>
                    <svg 
                      className="w-4 h-4 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {cars.length === 0 && (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending documents</h3>
              <p className="mt-1 text-sm text-gray-500">There are no documents waiting for verification.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 