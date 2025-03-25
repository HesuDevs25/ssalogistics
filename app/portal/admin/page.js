"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";


export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    verifiedDocuments: 0,
    recentActivity: [],
    documentStats: {
      billOfLading: 0,
      commercialInvoice: 0,
      vehicleRegistration: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [createUserError, setCreateUserError] = useState('');

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Check if user is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/portal');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          router.push('/portal');
          return;
        }

        // Fetch users using service role client
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        //if (usersError) throw usersError;
        setUsers(usersData || []);

        // Fetch documents using service role client
        const { data: docsData, error: docsError } = await supabaseAdmin
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (docsError) throw docsError;
        setDocuments(docsData || []);

        // Calculate analytics
        const stats = {
          totalUsers: usersData?.length || 0,
          totalDocuments: docsData?.length || 0,
          pendingDocuments: docsData?.filter(doc => doc.status === 'pending').length || 0,
          verifiedDocuments: docsData?.filter(doc => doc.status === 'verified').length || 0,
          documentStats: {
            billOfLading: docsData?.filter(doc => doc.type === 'billOfLading').length || 0,
            commercialInvoice: docsData?.filter(doc => doc.type === 'commercialInvoice').length || 0,
            vehicleRegistration: docsData?.filter(doc => doc.type === 'vehicleRegistration').length || 0
          }
        };

        // Get recent activity
        const recentActivity = [
          ...(docsData?.slice(0, 5).map(doc => ({
            type: 'document',
            action: 'uploaded',
            user: usersData?.find(u => u.id === doc.user_id)?.name || 'Unknown User',
            details: doc.name,
            timestamp: doc.created_at
          })) || []),
          ...(usersData?.slice(0, 5).map(user => ({
            type: 'user',
            action: 'registered',
            user: user.name,
            details: user.email,
            timestamp: user.created_at
          })) || [])
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setAnalytics({
          ...stats,
          recentActivity: recentActivity.slice(0, 10)
        });

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleUserStatusUpdate = async (userId, newStatus) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      //if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDocumentStatusUpdate = async (docId, newStatus) => {
    try {
      const { error } = await supabaseAdmin
        .from('documents')
        .update({ status: newStatus })
        .eq('id', docId);

      //if (error) throw error;

      // Update local state
      setDocuments(documents.map(doc => 
        doc.id === docId ? { ...doc, status: newStatus } : doc
      ));
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

     // if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        ]);

      //if (profileError) throw profileError;

      // Refresh users list
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Reset form and close modal
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'customer'
      });
      setShowCreateUserModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setCreateUserError(error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/portal')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Portal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "documents"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "analytics"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900">Total Users</h3>
                  <p className="mt-2 text-3xl font-bold text-blue-900">{analytics.totalUsers}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900">Total Documents</h3>
                  <p className="mt-2 text-3xl font-bold text-green-900">{analytics.totalDocuments}</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-900">Pending Documents</h3>
                  <p className="mt-2 text-3xl font-bold text-yellow-900">{analytics.pendingDocuments}</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-900">Verified Documents</h3>
                  <p className="mt-2 text-3xl font-bold text-purple-900">{analytics.verifiedDocuments}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              {/* User Management Controls */}
              <div className="mb-6 flex justify-between items-center">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 placeholder-gray-600 bg-white shadow-sm"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 bg-white shadow-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Create User
                </button>
              </div>

              {/* Create User Modal */}
              {showCreateUserModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                  <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                      <button
                        onClick={() => setShowCreateUserModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border-2 border-gray-400 rounded-md shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border-2 border-gray-400 rounded-md shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border-2 border-gray-400 rounded-md shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border-2 border-gray-400 rounded-md shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      {createUserError && (
                        <div className="text-red-600 text-sm">{createUserError}</div>
                      )}
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowCreateUserModal(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Documents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-700 text-lg">
                                  {(user.name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-700">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900"
                          >
                            <option value="customer">Customer</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.status}
                            onChange={(e) => handleUserStatusUpdate(user.id, e.target.value)}
                            className={`text-sm border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 ${
                              user.status === 'active' ? 'border-green-300 bg-green-50' :
                              user.status === 'inactive' ? 'border-gray-300 bg-gray-50' :
                              'border-red-300 bg-red-50'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {documents.filter(doc => doc.user_id === user.id).length}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-900 hover:text-blue-800 mr-4"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleUserStatusUpdate(user.id, user.status === 'active' ? 'suspended' : 'active')}
                            className={`${
                              user.status === 'active' ? 'text-red-900 hover:text-red-800' : 'text-green-900 hover:text-green-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div>
              {/* Document Management Controls */}
              <div className="mb-6 flex justify-between items-center">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 placeholder-gray-600 bg-white shadow-sm"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 bg-white shadow-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Documents Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Document</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents
                      .filter(doc => {
                        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (users.find(u => u.id === doc.user_id)?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
                        return matchesSearch && matchesStatus;
                      })
                      .map((doc) => (
                        <tr key={doc.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                <div className="text-sm text-gray-700">{doc.size}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {users.find(u => u.id === doc.user_id)?.name || 'Unknown User'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={doc.status}
                              onChange={(e) => handleDocumentStatusUpdate(doc.id, e.target.value)}
                              className={`text-sm border rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 ${
                                doc.status === 'verified' ? 'border-green-300 bg-green-50' :
                                doc.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                                'border-red-300 bg-red-50'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="text-blue-900 hover:text-blue-800 mr-4"
                              onClick={() => window.open(doc.file_url, '_blank')}
                            >
                              View
                            </button>
                            <button
                              className="text-red-900 hover:text-red-800"
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this document?')) {
                                  try {
                                    const { error } = await supabaseAdmin
                                      .from('documents')
                                      .delete()
                                      .eq('id', doc.id);

                                    if (error) throw error;

                                    // Update local state
                                    setDocuments(documents.filter(d => d.id !== doc.id));
                                  } catch (error) {
                                    console.error('Error deleting document:', error);
                                    alert('Failed to delete document');
                                  }
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Document Type Distribution */}
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-4">Document Type Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900">Bill of Lading</h3>
                    <p className="mt-2 text-3xl font-bold text-blue-900">{analytics.documentStats.billOfLading}</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900">Commercial Invoice</h3>
                    <p className="mt-2 text-3xl font-bold text-green-900">{analytics.documentStats.commercialInvoice}</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-900">Vehicle Registration</h3>
                    <p className="mt-2 text-3xl font-bold text-purple-900">{analytics.documentStats.vehicleRegistration}</p>
                  </div>
                </div>
              </div>

              {/* User Activity */}
              <div>
                <h2 className="text-xl font-bold text-blue-900 mb-4">User Activity</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => {
                        const userDocs = documents.filter(doc => doc.user_id === user.id);
                        const lastDoc = userDocs[0];
                        return (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 text-lg">
                                      {(user.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{userDocs.length}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {(user.role || 'Unknown').charAt(0).toUpperCase() + (user.role || 'Unknown').slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lastDoc ? new Date(lastDoc.created_at).toLocaleDateString() : 'No activity'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
