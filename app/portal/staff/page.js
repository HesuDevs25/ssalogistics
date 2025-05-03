"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function StaffDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("activationRequests");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activationRequests, setActivationRequests] = useState([]);
  const [staff, setStaff] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState({
    totalAgents: 0,
    approvedVehicles: 0,
    pendingVehicles: 0,
    pendingActivations: 0,
    rejectedVehicles: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Check if user is staff
  useEffect(() => {
    const checkStaffAccess = async () => {
      try {
        setIsLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/portal');
          return;
        }

        // Check if user has staff role
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

        setStaff(profile);
        await fetchUsers();
        await fetchDocuments();
        await fetchActivationRequests();
        await fetchDashboardData();
      } catch (error) {
        console.error('Error checking staff access:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkStaffAccess();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchActivationRequests = async () => {
    try {
      // Join with profiles to get user details
      const { data, error } = await supabaseAdmin
        .from('account_activation_requests')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activation requests:', error);
        return;
      }

      setActivationRequests(data || []);
    } catch (error) {
      console.error('Error fetching activation requests:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch stats using supabaseAdmin for admin privileges
      const [
        { count: totalAgentsCount, error: agentsError },
        { count: approvedVehiclesCount, error: approvedError },
        { count: pendingVehiclesCount, error: pendingError },
        { count: pendingActivationsCount, error: activationsError },
        { count: rejectedVehiclesCount, error: rejectedError }
      ] = await Promise.all([
        // Only count customers with account_status 'active'
        supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'customer')
          .eq('account_status', 'active'),
        supabaseAdmin
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabaseAdmin
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabaseAdmin
          .from('account_activation_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabaseAdmin
          .from('vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected')
      ]);

      if (agentsError) console.error('Error fetching total agents:', agentsError);
      if (approvedError) console.error('Error fetching approved vehicles:', approvedError);
      if (pendingError) console.error('Error fetching pending vehicles:', pendingError);
      if (activationsError) console.error('Error fetching pending activations:', activationsError);
      if (rejectedError) console.error('Error fetching rejected vehicles:', rejectedError);

      setStats({
        totalAgents: totalAgentsCount ?? 0,
        approvedVehicles: approvedVehiclesCount ?? 0,
        pendingVehicles: pendingVehiclesCount ?? 0,
        pendingActivations: pendingActivationsCount ?? 0,
        rejectedVehicles: rejectedVehiclesCount ?? 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine recent activity (documents + users) just like admin
  useEffect(() => {
    if (!users.length && !documents.length) return;

    const recent = [
      ...(documents.slice(0, 5).map(doc => ({
        type: 'document',
        action: 'uploaded',
        user: users.find(u => u.id === doc.user_id)?.name || 'Unknown User',
        details: doc.name,
        timestamp: doc.created_at
      })) || []),
      ...(users.slice(0, 5).map(user => ({
        type: 'user',
        action: 'registered',
        user: user.name,
        details: user.email,
        timestamp: user.created_at
      })) || [])
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setRecentActivity(recent.slice(0, 3)); // Limit to only 5 latest
  }, [users, documents]);

  const handleApproveRequest = async (requestId, userId) => {
    try {
      setIsLoading(true);

      // Update activation request status
      const { error: requestError } = await supabaseAdmin
        .from('account_activation_requests')
        .update({
          status: 'approved',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          notes: 'Account activation approved'
        })
        .eq('id', requestId);

      if (requestError) {
        console.error('Error updating activation request:', requestError);
        throw new Error('Failed to approve request');
      }

      // Update user profile status
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: 'active' })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        throw new Error('Failed to activate user account');
      }

      // Create notification for user
      await supabaseAdmin
        .from('notifications')
        .insert([{
          type: 'account_activation',
          title: 'Account Activation Approved',
          message: 'Your account has been activated. You now have full access to all features.',
          recipient_id: userId
        }]);

      // Refresh data
      await fetchActivationRequests();
      await fetchUsers();
      await fetchDocuments();

      alert('Account activation approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.message || 'Failed to approve request');
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsLoading(true);

      // Update activation request status
      const { error: requestError } = await supabaseAdmin
        .from('account_activation_requests')
        .update({
          status: 'rejected',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          notes: rejectReason.trim()
        })
        .eq('id', selectedRequest.id);

      if (requestError) {
        console.error('Error updating activation request:', requestError);
        throw new Error('Failed to reject request');
      }

      // Create notification for user
      await supabaseAdmin
        .from('notifications')
        .insert([{
          type: 'account_activation',
          title: 'Account Activation Rejected',
          message: `Your account activation request was rejected. Reason: ${rejectReason.trim()}`,
          recipient_id: selectedRequest.user_id
        }]);

      // Refresh data
      await fetchActivationRequests();

      setShowRejectModal(false);
      alert('Account activation rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };

  const viewDocuments = (request) => {
    // Open authorization letter and ID in new tabs
    window.open(supabaseAdmin.storage.from('verification-docs').getPublicUrl(request.auth_letter_path).data.publicUrl, '_blank');
    window.open(supabaseAdmin.storage.from('verification-docs').getPublicUrl(request.id_document_path).data.publicUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 animate-pulse">
        {/* Skeleton Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Skeleton Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton Recent Activities */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-5 w-1/4 bg-gray-200 rounded"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/4 mt-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Skeleton Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <div className="py-4 px-1 border-b-2 border-gray-300 w-32">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="py-4 px-1 border-b-2 border-transparent w-24">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </nav>
          </div>
          {/* Skeleton Tab Content */}
          <div>
            <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
            <div className="bg-white shadow overflow-hidden rounded-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="px-6 py-4">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow w-full">
        <div className="w-full py-6 flex justify-between items-center px-0">
          <h1 className="text-2xl font-bold text-gray-900 ml-6">Dashboard</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/portal');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 mr-6"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 w-full py-6 px-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Customers Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verified Agents</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalAgents}</p>
              </div>
            </div>
          </div>
          {/* Pending Vehicles Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Vehicles</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingVehicles}</p>
              </div>
            </div>
          </div>
          {/* Approved Vehicles Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved Vehicles</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approvedVehicles}</p>
              </div>
            </div>
          </div>
          {/* Pending Activations Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingActivations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity (copied from admin) */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Recent Activity</h2>
          </div>
          <div className="space-y-4 p-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'document' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <svg className={`w-4 h-4 ${
                    activity.type === 'document' ? 'text-blue-600' : 'text-green-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {activity.type === 'document' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user} {activity.action} {activity.type === 'document' ? 'a document' : 'an account'}
                  </p>
                  <p className="text-sm text-gray-500">{activity.details}</p>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500">No recent activities found.</div>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("activationRequests")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "activationRequests"
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Activation Requests
            </button>
            <button
              onClick={() => setActiveTab("agents")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agents"
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
            Customers
            </button>
          </nav>
        </div>

        {activeTab === "activationRequests" && (
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4">Account Activation Requests</h2>
            
            {activationRequests.length > 0 ? (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                  {activationRequests.map((request) => (
                    <li key={request.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">{request.profiles.name || 'Unknown'}</h3>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Email: {request.profiles.email}</p>
                          <p className="text-sm text-gray-500">Company: {request.company_name}</p>
                          <p className="text-sm text-gray-500">Submitted: {new Date(request.created_at).toLocaleString()}</p>
                          
                          {request.status !== 'pending' && (
                            <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                              <p className="text-sm font-medium text-gray-700">Review Notes:</p>
                              <p className="text-sm text-gray-600">{request.notes || 'No notes provided'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Reviewed on {new Date(request.reviewed_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewDocuments(request)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              View Documents
                            </button>
                            <button
                              onClick={() => handleApproveRequest(request.id, request.user_id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(request)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg text-center">
                <p className="text-gray-500">No activation requests found.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "agents" && (
          <div>
          <h2 className="text-xl font-bold text-blue-900 mb-4">All Customers</h2>
            
            {users.length > 0 ? (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Since
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.account_status === 'active' ? 'bg-green-100 text-green-800' :
                            user.account_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.account_status ? user.account_status.charAt(0).toUpperCase() + user.account_status.slice(1) : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              // View user details or activate/deactivate 
                              // Implementation for additional actions
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg text-center">
                <p className="text-gray-500">No users found.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reject Activation Request</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please provide a reason for rejection. This will be visible to the user.
                      </p>
                      <textarea
                        className="mt-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        rows="4"
                        placeholder="Enter reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRejectRequest}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 