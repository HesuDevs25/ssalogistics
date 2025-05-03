"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  DocumentCheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default function VerifiedVehicleDetailsPage({ params }) {
  const router = useRouter();
  const { vehicleId } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);

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

        // Fetch documents
        const { data: docs, error: docsError } = await supabaseAdmin
          .from('documents')
          .select('*')
          .eq('vehicle_id', vehicleId);
        if (docsError) {
          console.error("Documents fetch error:", docsError);
          throw docsError;
        }
        setDocuments(docs || []);

      } catch (error) {
        console.error("Error loading vehicle or documents:", error);
        setError("Failed to load vehicle or documents.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

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
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Vehicle</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/portal/staff/verified-vehicles"
            className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2"/>
            Back to Verified Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <Link
              href="/portal/staff/verified-vehicles"
              className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2"/>
              Back to Verified Vehicles
            </Link>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Verified Vehicle Details</h1>
                <p className="text-gray-600 mt-1 text-lg">
                  Chassis: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{vehicle?.chassis_number}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  Owner: <span className="font-medium">{owner?.name || owner?.email}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium inline-flex items-center">
                  <DocumentCheckIcon className="h-4 w-4 mr-1.5"/>
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b pb-2">Approved Documents</h2>
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{doc.name || doc.type}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {doc.file_path && (
                    <button
                      onClick={() => handleViewDocument(doc.file_path)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-2"/>
                      View Document
                    </button>
                  )}
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <DocumentCheckIcon className="h-3 w-3 mr-1"/>
                    Approved
                  </span>
                </div>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No documents found for this vehicle.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 