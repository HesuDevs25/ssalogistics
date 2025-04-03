"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function ActivationRequestsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [staff, setStaff] = useState(null);

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
      await fetchRequests();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
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

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching activation requests:', error);
    }
  };

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

      if (requestError) throw requestError;

      // Update user profile status
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: 'active' })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert([{
          type: 'account_activation',
          title: 'Account Activation Approved',
          message: 'Your account has been activated. You now have full access to all features.',
          recipient_id: userId
        }]);

      await fetchRequests();
      alert('Account activation approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    } finally {
      setIsLoading(false);
    }
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

      if (requestError) throw requestError;

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert([{
          type: 'account_activation',
          title: 'Account Activation Rejected',
          message: `Your account activation request was rejected. Reason: ${rejectReason.trim()}`,
          recipient_id: selectedRequest.user_id
        }]);

      await fetchRequests();
      setShowRejectModal(false);
      alert('Account activation rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Activation Requests</h1>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {requests.map((request) => (
            <li key={request.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.profiles.name || request.profiles.email}
                    </h3>
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
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(request.auth_letter_url, '_blank')}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Documents
                  </button>

                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveRequest(request.id, request.user_id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {request.status !== 'pending' && (
                <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                  <p className="text-sm font-medium text-gray-700">Review Notes:</p>
                  <p className="text-sm text-gray-600">{request.notes || 'No notes provided'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Reviewed on {new Date(request.reviewed_at).toLocaleString()}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Activation Request</h3>
                <div className="mt-2">
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="4"
                    placeholder="Enter reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>
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