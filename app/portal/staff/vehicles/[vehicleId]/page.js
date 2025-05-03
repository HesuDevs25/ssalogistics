"use client";
import { useState, useEffect, use } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function VehicleDocumentVerification({ params }) {
  const router = useRouter();
  const { vehicleId } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docStatuses, setDocStatuses] = useState({});
  const [docRemarks, setDocRemarks] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch vehicle
        const { data: vehicleData, error: vehicleError } = await supabaseAdmin
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();
        if (vehicleError) {
          console.error("Vehicle fetch error:", vehicleError);
          throw vehicleError;
        }
        setVehicle(vehicleData);

        // Fetch owner
        const { data: ownerData, error: ownerError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email')
          .eq('id', vehicleData.user_id)
          .single();
        if (ownerError) {
          console.error("Owner fetch error:", ownerError);
          throw ownerError;
        }
        setOwner(ownerData);

        // Fetch documents for this vehicle
        const { data: docs, error: docsError } = await supabaseAdmin
          .from('documents')
          .select('*')
          .eq('vehicle_id', vehicleId);
        if (docsError) {
          console.error("Documents fetch error:", docsError);
          throw docsError;
        }
        setDocuments(docs || []);

        // Set initial statuses and remarks for each document
        const statusObj = {};
        const remarksObj = {};
        (docs || []).forEach(doc => {
          statusObj[doc.id] = doc.status || "pending";
          remarksObj[doc.id] = doc.remarks || "";
        });
        setDocStatuses(statusObj);
        setDocRemarks(remarksObj);
      } catch (error) {
        console.error("Error loading vehicle or documents:", error);
        setSubmitError("Failed to load vehicle or documents. Please check your database relationships and data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [vehicleId]);

  const handleDocStatusChange = (docId, status) => {
    setDocStatuses(prev => ({ ...prev, [docId]: status }));
    if (status !== "rejected") {
      setDocRemarks(prev => ({ ...prev, [docId]: "" }));
    }
  };

  const handleDocRemarkChange = (docId, remark) => {
    setDocRemarks(prev => ({ ...prev, [docId]: remark }));
  };

  const canApproveVehicle = () =>
    documents.length > 0 && documents.every(doc => docStatuses[doc.id] === "approved");

  const canRejectVehicle = () =>
    documents.some(doc => docStatuses[doc.id] === "rejected");

  const handleSubmit = async (finalStatus) => {
    setSubmitError("");
    // Validation
    for (const doc of documents) {
      if (docStatuses[doc.id] === "rejected" && !docRemarks[doc.id].trim()) {
        setSubmitError(`Remarks required for rejected document: ${doc.name || doc.type}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      // Update documents
      for (const doc of documents) {
        const { error } = await supabaseAdmin
          .from('documents')
          .update({
            status: docStatuses[doc.id],
            remarks: docStatuses[doc.id] === "rejected" ? docRemarks[doc.id] : null
          })
          .eq('id', doc.id);
        if (error) {
          console.error(`Error updating document (${doc.id}):`, error);
          throw error;
        }
      }
      // Update vehicle
      const { error: vehicleUpdateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          status: finalStatus
        })
        .eq('id', vehicleId);
      if (vehicleUpdateError) {
        console.error("Error updating vehicle:", vehicleUpdateError);
        throw vehicleUpdateError;
      }

      router.push("/portal/staff/vehicles");
    } catch (error) {
      console.error("Error submitting review:", error);
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = async (filePath) => {
    try {
      const { data, error } = await supabaseAdmin
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicle and documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">Vehicle Review</h1>
          <p className="text-gray-700 mb-2">Chassis: <span className="font-mono">{vehicle?.chassis_number}</span></p>
          <p className="text-gray-700 mb-4">Owner: {owner?.name || owner?.email}</p>
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Documents</h2>
          <div className="space-y-6">
            {documents.length === 0 && (
              <div className="text-center text-red-600 font-semibold">No documents submitted for this vehicle.</div>
            )}
            {documents.map(doc => (
              <div key={doc.id} className="border-b pb-4 mb-4 bg-blue-50 rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-900 text-base">{doc.name || doc.type}</span>
                    <span className="ml-2 text-xs text-gray-500">({doc.type})</span>
                  </div>
                  {doc.file_path ? (
                    <button
                      className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 transition font-semibold shadow border border-blue-900"
                      onClick={() => handleViewDocument(doc.file_path)}
                      title="View PDF document"
                    >
                      View PDF
                    </button>
                  ) : (
                    <span className="text-red-600 text-sm font-semibold">No file submitted</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-semibold">Status:</span> {docStatuses[doc.id] || 'pending'}
                </div>
                <div className="mt-3 flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={`status-${doc.id}`}
                      value="approved"
                      checked={docStatuses[doc.id] === "approved"}
                      onChange={() => handleDocStatusChange(doc.id, "approved")}
                      disabled={!doc.file_path}
                      className="accent-green-600 w-5 h-5"
                    />
                    <span className="ml-2 text-green-700 font-medium">Approve</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={`status-${doc.id}`}
                      value="rejected"
                      checked={docStatuses[doc.id] === "rejected"}
                      onChange={() => handleDocStatusChange(doc.id, "rejected")}
                      disabled={!doc.file_path}
                      className="accent-red-600 w-5 h-5"
                    />
                    <span className="ml-2 text-red-700 font-medium">Reject</span>
                  </label>
                </div>
                {docStatuses[doc.id] === "rejected" && (
                  <div className="mt-3">
                    <label className="block mb-1 font-semibold text-red-700">Remarks (required for rejection):</label>
                    <textarea
                      className="w-full border-4 border-red-600 rounded-lg p-3 bg-red-100 text-red-900 placeholder-red-500 focus:ring-2 focus:ring-red-400 font-semibold text-base shadow-md"
                      rows={3}
                      placeholder={`Enter remarks for ${doc.name || doc.type}`}
                      value={docRemarks[doc.id]}
                      onChange={e => handleDocRemarkChange(doc.id, e.target.value)}
                      required
                      disabled={!doc.file_path}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {submitError && (
            <div className="text-red-600 mt-4">{submitError}</div>
          )}
          <div className="flex space-x-4 mt-8">
            <button
              className={`px-4 py-2 rounded bg-green-700 text-white font-semibold ${!canApproveVehicle() ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!canApproveVehicle() || isLoading}
              onClick={() => handleSubmit("approved")}
            >
              Approve Vehicle
            </button>
            <button
              className={`px-4 py-2 rounded bg-red-700 text-white font-semibold ${!canRejectVehicle() ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!canRejectVehicle() || isLoading}
              onClick={() => handleSubmit("rejected")}
            >
              Reject Vehicle
            </button>
            <button
              className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-semibold"
              onClick={() => router.push("/portal/staff/vehicles")}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 