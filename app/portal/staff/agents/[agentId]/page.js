"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, UserCircleIcon, TruckIcon } from "@heroicons/react/24/outline";
import { use } from "react";

export default function AgentDetailPage({ params }) {
  const router = useRouter();
  // Use React.use to unwrap the params Promise
  const unwrappedParams = use(params);
  const agentId = unwrappedParams.agentId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  const checkStaffAccess = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/portal');
        return false;
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'staff') {
        console.error('Not authorized as staff:', profileError);
        router.push('/portal');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
      return false;
    }
  }, [router]);

  const fetchAgentData = useCallback(async () => {
    if (!agentId) return;
    
    try {
      // Fetch agent profile
      const { data: agentData, error: agentError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;
      if (!agentData) throw new Error('Agent not found');
      
      setAgent(agentData);

      // Fetch vehicles submitted by this agent, excluding draft status
      const { data: vehiclesData, error: vehiclesError } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('user_id', agentId)
        .neq('status', 'draft')  // Exclude vehicles with draft status
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);
    } catch (err) {
      console.error("Error fetching agent data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    const initialize = async () => {
      const hasAccess = await checkStaffAccess();
      if (hasAccess) {
        await fetchAgentData();
      }
    };
    
    initialize();
  }, [checkStaffAccess, fetchAgentData]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      inactive: "bg-red-100 text-red-800",
      suspended: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || "bg-gray-100 text-gray-800"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getVehicleStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      verified: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || "bg-gray-100 text-gray-800"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-gray-600">Loading agent data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
        <h2 className="text-lg font-medium">Error</h2>
        <p>{error}</p>
        <Link href="/portal/staff/agents" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Return to Customers List
        </Link>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        <h2 className="text-lg font-medium">Customer Not Found</h2>
        <p>The requested customer could not be found.</p>
        <Link href="/portal/staff/agents" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Return to Customers List
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/portal/staff/agents"
          className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2"/>
          Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-blue-900">Customer Details</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-start">
          <div className="bg-blue-100 p-4 rounded-full mr-6">
            <UserCircleIcon className="h-16 w-16 text-blue-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{agent.name || 'No Name Provided'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-gray-700">{agent.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="text-gray-700">{agent.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Account Status</p>
                <div>{getStatusBadge(agent.account_status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Joined</p>
                <p className="text-gray-700">{new Date(agent.created_at).toLocaleDateString()}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Company</p>
                <p className="text-gray-700">{agent.company || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            <div className="flex items-center">
              <TruckIcon className="h-6 w-6 text-blue-700 mr-2" />
              Vehicles
            </div>
          </h2>
          <div className="text-gray-500 text-sm">
            Total: {vehicles.length}
          </div>
        </div>
        
        {vehicles.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-gray-600">This customer has not submitted any vehicles yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make & Model</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                      {vehicle.chassis_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.make} {vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getVehicleStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vehicle.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => router.push(`/portal/staff/vehicles/${vehicle.id}`)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 