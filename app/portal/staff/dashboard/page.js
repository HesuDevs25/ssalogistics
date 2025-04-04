"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingDocuments, setPendingDocuments] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch pending activation requests
      const { data: requests, error: requestsError } = await supabaseAdmin
        .from('account_activation_requests')
        .select('*')
        .eq('status', 'pending');

      if (!requestsError) {
        setPendingRequests(requests.length);
      }

      // Fetch pending documents
      const { data: documents, error: documentsError } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('status', 'pending');

      if (!documentsError) {
        setPendingDocuments(documents.length);
      }

      // Fetch total agents
      const { data: agents, error: agentsError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'customer');

      if (!agentsError) {
        setTotalAgents(agents.length);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

      setUser(profile);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  }, [router, fetchDashboardData]);

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Staff Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900">Pending Activation Requests</h2>
            <p className="text-3xl font-bold text-blue-900 mt-2">{pendingRequests}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900">Pending Documents</h2>
            <p className="text-3xl font-bold text-blue-900 mt-2">{pendingDocuments}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900">Total Agents</h2>
            <p className="text-3xl font-bold text-blue-900 mt-2">{totalAgents}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 