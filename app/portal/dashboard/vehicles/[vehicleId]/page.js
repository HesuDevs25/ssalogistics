"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentMinusIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  PencilIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from "@/lib/supabase";

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'approved': return <CheckCircleIcon className="h-4 w-4 mr-1.5 inline-block" />;
    case 'pending': return <ClockIcon className="h-4 w-4 mr-1.5 inline-block" />;
    case 'rejected': return <XCircleIcon className="h-4 w-4 mr-1.5 inline-block" />;
    case 'draft': return <ExclamationCircleIcon className="h-4 w-4 mr-1.5 inline-block" />;
    default: return null;
  }
};

const REQUIRED_DOC_TYPES = [
  { id: "billOfLading", name: "Bill of Lading" },
  { id: "releaseOrder", name: "Release Order" },
  { id: "vehicleRegistration", name: "Vehicle Registration" }
];

export default function VehicleDetailsPage({ params }) {
  const router = useRouter();
  const { vehicleId } = use(params);

  const [vehicle, setVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const fetchVehicle = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();
        if (error) {
          setError(error.message);
          console.error("Error fetching vehicle:", error);
          setVehicle(null);
        } else {
          setVehicle(data);
        }
      } catch (err) {
        setError("Unexpected error fetching vehicle.");
        console.error("Unexpected error fetching vehicle:", err);
        setVehicle(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) return;
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('vehicle_id', vehicleId);
        if (error) {
          console.error("Error fetching documents:", error);
          setDocuments([]);
        } else {
          setDocuments(data || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching documents:", err);
        setDocuments([]);
      }
    };
    fetchDocuments();
  }, [vehicleId, isLoading]);

  // Helper to update documents_uploaded count for the vehicle
  const updateDocumentsUploadedCount = async (vehicleId) => {
    try {
      // Count documents for this vehicle (excluding rejected)
      const { count, error } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('vehicle_id', vehicleId)
        .neq('status', 'rejected');
      if (error) {
        console.error("Error counting documents:", error);
        return;
      }
      // Update the vehicle's documents_uploaded field
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ documents_uploaded: count })
        .eq('id', vehicleId);
      if (updateError) {
        console.error("Error updating documents_uploaded:", updateError);
      }
    } catch (err) {
      console.error("Unexpected error updating documents_uploaded:", err);
    }
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file || !vehicle || vehicle.status === 'pending' || vehicle.status === 'approved') {
      alert('Cannot upload file at this time. Ensure vehicle status is not Pending or Approved, and a file is selected.');
      e.target.value = null;
      return;
    }

    if (file.type !== "application/pdf") {
      alert('Only PDF files are allowed.');
      e.target.value = null;
      return;
    }

    setIsLoading(true);

    try {
      const filePath = `${vehicle.id}/${docType.id}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        setIsLoading(false);
        console.error("Error uploading file:", uploadError);
        alert(`Error uploading file: ${uploadError.message}`);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { error: docError } = await supabase
        .from('documents')
        .insert([{
          vehicle_id: vehicle.id,
          user_id: user.id,
          type: docType.id,
          name: file.name,
          status: 'pending',
          remarks: null,
          file_path: filePath
        }])
        .select('*')
        .single();

      if (docError) {
        setIsLoading(false);
        console.error("Error saving document record:", docError);
        alert(`Error saving document record: ${docError.message}`);
        return;
      }

      alert(`${docType.name} uploaded successfully!`);
      // Update documents_uploaded count after upload
      await updateDocumentsUploadedCount(vehicle.id);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Unexpected error uploading document:", err);
      alert("Unexpected error uploading document.");
    } finally {
      e.target.value = null;
      setIsLoading(false);
    }
  };

  const handleDelete = async (docId, docType) => {
    if (!vehicle || vehicle.status === 'pending' || vehicle.status === 'approved') {
      alert('Cannot delete documents when vehicle is pending or approved.');
      return;
    }

    const docToDelete = documents.find(d => d.id === docId);
    if (!docToDelete) {
      alert('Document not found.');
      return;
    }
    if (docToDelete.status === 'approved') {
      alert('Cannot delete an approved document.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the ${docType}?`)) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Delete from Supabase Storage bucket
      const { error: storageError } = await supabase
        .storage
        .from('documents')
        .remove([docToDelete.file_path]);
      if (storageError) {
        setIsLoading(false);
        console.error("Error deleting file from storage:", storageError);
        alert(`Error deleting file from storage: ${storageError.message}`);
        return;
      }

      // 2. Delete from Supabase documents table
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
      if (dbError) {
        setIsLoading(false);
        console.error("Error deleting document record:", dbError);
        alert(`Error deleting document record: ${dbError.message}`);
        return;
      }

      alert('Document deleted successfully!');
      // Update documents_uploaded count after delete
      await updateDocumentsUploadedCount(vehicle.id);
      // Refetch documents to update UI
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      setIsLoading(false);
      console.error("Unexpected error deleting document:", err);
      alert("Unexpected error deleting document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!vehicle || (vehicle.status !== 'draft' && vehicle.status !== 'rejected')) {
      alert('Vehicle cannot be submitted for approval in its current state.');
      return;
    }

    // Ensure all required documents are present and not rejected
    const allDocsPresent = REQUIRED_DOC_TYPES.every(docType => {
      const doc = documents.find(d => d.type === docType.id && d.status !== 'rejected');
      return !!doc;
    });

    if (!allDocsPresent) {
      alert(`Please upload all ${REQUIRED_DOC_TYPES.length} required documents before submitting.`);
      return;
    }

    if (!window.confirm('Are you sure you want to submit this vehicle and its documents for approval? You will not be able to make changes after submission.')) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Update all related documents' status to 'pending' (if not already)
      const docIdsToUpdate = documents
        .filter(d => d.status !== 'pending' && d.status !== 'approved' && d.status !== 'rejected')
        .map(d => d.id);

      if (docIdsToUpdate.length > 0) {
        const { error: docUpdateError } = await supabase
          .from('documents')
          .update({ status: 'pending' })
          .in('id', docIdsToUpdate);

        if (docUpdateError) {
          setIsLoading(false);
          console.error("Error updating document statuses:", docUpdateError);
          alert(`Error updating document statuses: ${docUpdateError.message}`);
          return;
        }
      }

      // 2. Update the vehicle status to 'pending'
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'pending' })
        .eq('id', vehicle.id);

      if (vehicleError) {
        setIsLoading(false);
        console.error("Error updating vehicle status:", vehicleError);
        alert(`Error updating vehicle status: ${vehicleError.message}`);
        return;
      }

      alert('Vehicle and documents submitted for approval successfully!');
      // Refetch vehicle and documents to update UI
      const { data: updatedVehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicle.id)
        .single();
      setVehicle(updatedVehicle);

      const { data: updatedDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('vehicle_id', vehicle.id);
      setDocuments(updatedDocs || []);
    } catch (err) {
      setIsLoading(false);
      console.error("Unexpected error submitting for approval:", err);
      alert("Unexpected error submitting for approval.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = async (filePath) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath);

      if (error) {
        console.error("Error getting public URL:", error);
        alert("Could not get document URL.");
        return;
      }

      if (data?.publicUrl) {
        window.open(data.publicUrl, "_blank");
      } else {
        alert("Document URL not found.");
      }
    } catch (err) {
      console.error("Unexpected error getting document URL:", err);
      alert("Unexpected error getting document URL.");
    }
  };

  if (isLoading && !vehicle) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-gray-600">Loading vehicle details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4"/>
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Vehicle</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/portal/dashboard/vehicles"
          className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800"
        >
           <ArrowLeftIcon className="h-5 w-5 mr-2"/>
          Back to Vehicles List
        </Link>
      </div>
    );
  }

  const getDocumentForType = (docTypeId) => {
    return documents.find(doc => doc.type === docTypeId);
  };

  const canSubmit = vehicle?.status === 'draft' || vehicle?.status === 'rejected';
  const canModify = canSubmit;
  const allDocsUploaded = REQUIRED_DOC_TYPES.every(
    docType => {
      const doc = getDocumentForType(docType.id);
      return doc && doc.status !== 'rejected';
    }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
          <Link
            href="/portal/dashboard/vehicles"
            className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2"/>
            Back to Vehicles List
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-lg shadow-md border border-gray-200">
             <div>
                <h1 className="text-2xl font-bold text-blue-900">Vehicle Details</h1>
                <p className="text-gray-600 mt-1 text-lg">Chassis: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{vehicle?.chassis_number}</span></p>
             </div>
              <div className="flex items-center space-x-2 text-sm">
                 <span className="font-medium text-gray-700">Status:</span>
                 <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold ${getStatusBadgeClass(vehicle?.status)}`}>
                    {getStatusIcon(vehicle?.status)}
                    {vehicle?.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                 </span>
              </div>
          </div>
           {vehicle?.status === 'pending' && (
               <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
                  <span>This vehicle is currently under review. Documents cannot be modified.</span>
               </div>
           )}
           {vehicle?.status === 'approved' && (
               <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
                   <span>This vehicle has been approved.</span>
               </div>
           )}
           {vehicle?.status === 'rejected' && (
               <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-center">
                   <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
                   <span>This vehicle requires attention. Please update the rejected documents and resubmit.</span>
               </div>
           )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2">Required Documents</h2>
        <div className="space-y-6">
          {REQUIRED_DOC_TYPES.map((docType) => {
            const existingDoc = getDocumentForType(docType.id);
            const isRejected = existingDoc?.status === 'rejected';
            const isApproved = existingDoc?.status === 'approved';
            const canUploadThis = canModify && (!existingDoc || isRejected);
            const canDeleteThis = canModify && existingDoc && !isApproved;

            return (
              <div key={docType.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{docType.name}</h3>
                {existingDoc ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                          <DocumentCheckIcon className="h-5 w-5 text-blue-600"/>
                          <span className="font-medium truncate">{existingDoc.name}</span>
                      </div>
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(existingDoc.status)}`}>
                          {getStatusIcon(existingDoc.status)}
                          {existingDoc.status.replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    {isRejected && (
                       <div className="p-2 bg-red-50 border border-red-100 rounded text-red-700 text-xs">
                           <p className="font-medium">Rejection Reason:</p>
                           <p>{existingDoc.remarks || 'No reason provided.'}</p>
                       </div>
                    )}

                    <div className="flex flex-wrap gap-2 items-center">
                       <button
                          type="button"
                          onClick={() => handleViewDocument(existingDoc.file_path)}
                          className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 text-xs font-medium rounded text-gray-700 hover:bg-gray-50"
                        >
                          <EyeIcon className="h-4 w-4 mr-1"/> View
                       </button>
                      {isRejected && canModify && (
                         <label htmlFor={`file-update-${docType.id}`} className="inline-flex items-center px-3 py-1 bg-yellow-500 border border-transparent text-xs font-medium rounded text-white hover:bg-yellow-600 cursor-pointer">
                             <PencilIcon className="h-4 w-4 mr-1"/> Update File
                             <input
                                id={`file-update-${docType.id}`}
                                type="file"
                                className="sr-only"
                                onChange={(e) => handleFileUpload(e, docType)}
                              />
                         </label>
                      )}
                      {canDeleteThis && (
                        <button
                            onClick={() => handleDelete(existingDoc.id, docType.name)}
                            className="inline-flex items-center px-3 py-1 bg-red-600 border border-transparent text-xs font-medium rounded text-white hover:bg-red-700 disabled:opacity-50"
                            disabled={isLoading}
                        >
                           <TrashIcon className="h-4 w-4 mr-1"/> Delete
                        </button>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                     <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2"/>
                     <p className="text-sm text-gray-500 mb-3">No file uploaded yet.</p>
                    {canUploadThis ? (
                       <label htmlFor={`file-upload-${docType.id}`} className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50">
                          <DocumentArrowUpIcon className="h-5 w-5 mr-2"/>
                          Upload {docType.name}
                           <input
                              id={`file-upload-${docType.id}`}
                              name={`file-upload-${docType.id}`}
                              type="file"
                              accept="application/pdf"
                              className="sr-only"
                              onChange={(e) => handleFileUpload(e, docType)}
                              disabled={isLoading}
                            />
                       </label>
                    ) : (
                         <p className="text-sm text-gray-400 italic">(Upload disabled)</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {canSubmit && (
           <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Submit for Approval</h2>
                {!allDocsUploaded && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm flex items-center">
                        <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
                        <span>All required documents must be uploaded before you can submit this vehicle for approval.</span>
                    </div>
                )}
                <p className="text-sm text-gray-600 mb-4">
                   Once submitted, you will not be able to modify the uploaded documents unless the submission is rejected by an administrator.
                </p>
                <button
                  onClick={handleSubmitForApproval}
                  disabled={!allDocsUploaded || isLoading || vehicle?.status === 'pending'}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <PaperAirplaneIcon className="h-5 w-5 mr-2"/>
                   {isLoading ? 'Submitting...' : 'Submit for Approval'}
                </button>
           </div>
      )}
    </div>
  );
} 