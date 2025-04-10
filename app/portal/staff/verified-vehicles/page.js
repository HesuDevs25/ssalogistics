"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifiedVehicles() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cars, setCars] = useState([]);

  const fetchVerifiedCars = useCallback(async () => {
    try {
      // First, get all cars with their documents
      const { data: carsData, error: carsError } = await supabaseAdmin
        .from('cars')
        .select(`
          *,
          documents(*),
          profiles(id, name, email)
        `);

      if (carsError) throw carsError;

      // Filter cars where all documents are verified
      const verifiedCars = carsData.filter(car => {
        // If no documents, skip
        if (!car.documents || car.documents.length === 0) return false;
        
        // Check if all documents are verified
        return car.documents.every(doc => doc.status === 'verified');
      });

      // Process the data to get unique cars with document counts
      const uniqueCars = verifiedCars.map(car => ({
        ...car,
        document_count: car.documents.length
      }));

      setCars(uniqueCars);
    } catch (error) {
      console.error('Error fetching verified cars:', error);
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

      await fetchVerifiedCars();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  }, [router, fetchVerifiedCars]);

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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-blue-900">Verified Vehicles</h1>
            <Link
              href="/portal/staff/documents"
              className="flex items-center text-blue-900 hover:text-blue-800"
            >
              <svg 
                className="w-5 h-5 mr-2" 
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
              View Pending Documents
            </Link>
          </div>
          
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
                    <span className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-full">
                      {car.document_count} verified
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No verified vehicles</h3>
              <p className="mt-1 text-sm text-gray-500">There are no vehicles with all documents verified.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 