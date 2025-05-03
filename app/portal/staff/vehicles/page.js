"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function DocumentVerification() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userMap, setUserMap] = useState({});

  const fetchVehiclesWithPendingDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('status', 'pending');

      if (error) throw error;

      setVehicles(data || []);

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set((data || []).map(v => v.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        if (profilesError) {
          console.error('Error fetching agent profiles:', profilesError);
          setUserMap({});
        } else {
          // Map user_id to name
          const map = {};
          profiles.forEach(profile => {
            map[profile.id] = profile.name;
          });
          setUserMap(map);
        }
      } else {
        setUserMap({});
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
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

      await fetchVehiclesWithPendingDocuments();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  }, [router, fetchVehiclesWithPendingDocuments]);

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
          <h1 className="text-2xl font-bold text-blue-900 mb-8">Pending  Verification</h1>
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by chassis number..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
            />
          </div>
          <div className="space-y-3">
            {vehicles
              .filter(vehicle =>
                vehicle.chassis_number &&
                vehicle.chassis_number.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => router.push(`/portal/staff/vehicles/${vehicle.id}`)}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      Chassis: {vehicle.chassis_number}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Agent Name: {userMap[vehicle.user_id] ? userMap[vehicle.user_id] : 'Unknown'}
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

          {vehicles.length === 0 && (
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