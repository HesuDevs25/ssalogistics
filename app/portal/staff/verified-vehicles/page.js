"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function VerifiedVehicles() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  const fetchVerifiedVehicles = useCallback(async () => {
    try {
      // Fetch all vehicles with their documents and owner profiles
      const { data: vehiclesData, error: vehiclesError } = await supabaseAdmin
        .from('vehicles')
        .select(`
          *,
          documents(*),
          profiles(id, name, email)
        `);

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        throw vehiclesError;
      }

      // Filter vehicles where all documents are approved
      const verifiedVehicles = vehiclesData.filter(vehicle => {
        // If no documents, skip
        if (!vehicle.documents || vehicle.documents.length === 0) return false;
        
        // Check if all documents are approved
        return vehicle.documents.every(doc => doc.status === 'approved');
      });

      // Process the data to include document counts
      const processedVehicles = verifiedVehicles.map(vehicle => ({
        ...vehicle,
        document_count: vehicle.documents.length
      }));

      setVehicles(processedVehicles);
      setFilteredVehicles(processedVehicles);
    } catch (error) {
      console.error('Error fetching verified vehicles:', error);
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

      await fetchVerifiedVehicles();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  }, [router, fetchVerifiedVehicles]);

  useEffect(() => {
    checkStaffAccess();
  }, [checkStaffAccess]);

  // Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = vehicles.filter(vehicle => 
      vehicle.chassis_number.toLowerCase().includes(query) ||
      (vehicle.profiles?.name || '').toLowerCase().includes(query) ||
      (vehicle.profiles?.email || '').toLowerCase().includes(query)
    );
    setFilteredVehicles(filtered);
  }, [searchQuery, vehicles]);

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-2xl font-bold text-blue-900">Verified Vehicles</h1>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[300px]">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <Link
                href="/portal/staff/vehicles"
                className="flex items-center text-blue-900 hover:text-blue-800 whitespace-nowrap"
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
                View Pending Vehicles
              </Link>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => router.push(`/portal/staff/verified-vehicles/${vehicle.id}`)}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      Chassis: {vehicle.chassis_number}
                    </p>
                    <span className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-full ml-4">
                      {vehicle.document_count} approved
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Owner: {vehicle.profiles?.name || vehicle.profiles?.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Added: {new Date(vehicle.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center ml-4">
                  <svg 
                    className="w-5 h-5 text-gray-400"
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
            ))}
          </div>

          {filteredVehicles.length === 0 && (
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No verified vehicles found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? "No vehicles match your search criteria." 
                  : "There are no vehicles with all documents approved."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 