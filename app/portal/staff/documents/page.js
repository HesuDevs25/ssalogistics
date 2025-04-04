"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function DocumentVerification() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cars, setCars] = useState([]);

  const fetchCarsWithPendingDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('cars')
        .select(`
          *,
          documents!inner(*)
        `)
        .eq('documents.status', 'pending');

      if (error) throw error;

      // Process the data to get unique cars with pending document counts
      const uniqueCars = data.reduce((acc, car) => {
        if (!acc.find(c => c.id === car.id)) {
          acc.push({
            ...car,
            pending_documents: data.filter(c => c.id === car.id).length
          });
        }
        return acc;
      }, []);

      setCars(uniqueCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  }, []);

  const checkStaffAccess = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/portal');
        return;
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'staff') {
        console.error('Not authorized as staff:', profileError);
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
  }, [router, fetchCarsWithPendingDocuments]);

  useEffect(() => {
    checkStaffAccess();
  }, [checkStaffAccess]);

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
              <div
                key={car.id}
                onClick={() => router.push(`/portal/staff/documents/${car.id}`)}
                className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
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
              </div>
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