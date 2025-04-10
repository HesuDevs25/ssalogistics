"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendEmailNotification } from '@/lib/email';

export default function CarDocumentVerification({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const carId = resolvedParams.carId;
  const [isLoading, setIsLoading] = useState(true);
  const [car, setCar] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    checkStaffAccess();
  }, [carId]);

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

      await fetchCarAndDocuments();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCarAndDocuments = async () => {
    try {
      // Fetch car details using service role
      const { data: carData, error: carError } = await supabaseAdmin
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (carError) throw carError;

      // Fetch car owner profile using service role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .eq('id', carData.user_id)
        .single();

      if (profileError) throw profileError;

      // Combine car and profile data
      setCar({
        ...carData,
        profiles: profile
      });

      // Fetch documents using service role
      const { data: docs, error: docsError } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching car and documents:', error);
      router.push('/portal/staff/documents');
    }
  };

  const handleVerifyDocument = async (documentId, userId) => {
    try {
      setIsLoading(true);
      const { error } = await supabaseAdmin
        .from('documents')
        .update({
          status: 'verified'
        })
        .eq('id', documentId);

      if (error) throw error;

      // Create notification
      const notification = {
        type: 'document_verification',
        title: 'Document Verified',
        message: 'Your document has been verified successfully.',
        recipient_email: car.profiles.email
      };

      // Insert notification into database
      await supabaseAdmin
        .from('notifications')
        .insert([notification]);

      // Send email notification
      await sendEmailNotification({
        to: car.profiles.email,
        subject: notification.title,
        message: notification.message
      });

      await fetchCarAndDocuments();
      alert('Document verified successfully');
    } catch (error) {
      console.error('Error verifying document:', error);
      alert('Failed to verify document');
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectModal = (document) => {
    setSelectedDocument(document);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectDocument = async () => {
    if (!selectedDocument || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabaseAdmin
        .from('documents')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.trim()
        })
        .eq('id', selectedDocument.id);

      if (error) throw error;

      await supabaseAdmin
        .from('notifications')
        .insert([{
          type: 'document_verification',
          title: 'Document Rejected',
          message: `Your document was rejected. Reason: ${rejectReason.trim()}`,
          recipient_email: car.profiles.email
        }]);

      await fetchCarAndDocuments();
      setShowRejectModal(false);
      alert('Document rejected successfully');
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Failed to reject document');
    } finally {
      setIsLoading(false);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">Document Verification</h2>
              <p className="text-gray-600 mt-1">Chassis Number: {car?.chassis_number}</p>
              <p className="text-gray-600">Owner: {car?.profiles.name || car?.profiles.email}</p>
            </div>
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Cars
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm text-gray-900">{doc.name}</div>
                          <div className="text-sm text-gray-500">{doc.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doc.status === "verified" ? "bg-green-100 text-green-800" :
                        doc.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-blue-900 hover:text-blue-800 mr-4"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </span>
                      </button>
                      {doc.status === 'pending' && (
                        <>
                          <button 
                            className="text-green-900 hover:text-green-800 mr-4"
                            onClick={() => handleVerifyDocument(doc.id, car.profiles.id)}
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Verify
                            </span>
                          </button>
                          <button 
                            className="text-red-900 hover:text-red-800"
                            onClick={() => openRejectModal(doc)}
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {documents.length === 0 && (
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">There are no documents for this vehicle.</p>
            </div>
          )}
        </div>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Remarks</h3>
                <div className="mt-2">
                  <textarea
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-3 text-gray-900 placeholder-gray-500"
                    rows="4"
                    placeholder="Enter remarks for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRejectDocument}
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