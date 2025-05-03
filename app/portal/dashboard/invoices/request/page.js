"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function RequestInvoicePage() {
  const router = useRouter();
  const [approvedVehicles, setApprovedVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({ message: '', type: '' }); // 'success' or 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovedVehicles = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          router.push('/portal');
          return;
        }

        // Get vehicles with status = 'approved' belonging to the user
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, chassis_number, status, created_at')
          .eq('user_id', user.id)
          .eq('status', 'approved');
          
        if (vehiclesError) throw vehiclesError;

        // Check if any of these vehicles already have invoice requests
        const { data: existingInvoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('vehicle_id')
          .in('vehicle_id', vehiclesData.map(v => v.id) || []);
          
        if (invoicesError) throw invoicesError;

        // Filter out vehicles that already have invoice requests
        const existingInvoiceVehicleIds = new Set(existingInvoices.map(i => i.vehicle_id));
        const availableVehicles = vehiclesData.filter(v => !existingInvoiceVehicleIds.has(v.id));
        
        setApprovedVehicles(availableVehicles);
      } catch (err) {
        console.error("Error fetching approved vehicles:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovedVehicles();
  }, [router]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Please select a vehicle.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus({ message: '', type: '' });
    
    try {
      const selectedVehicle = approvedVehicles.find(v => v.id === selectedVehicleId);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Create invoice request in the database
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          vehicle_id: selectedVehicleId,
          user_id: user.id,
          status: 'requested',
          request_date: new Date().toISOString(),
        }])
        .select('id')
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Success!
      setSubmissionStatus({ 
        message: `Invoice requested successfully for ${selectedVehicle?.chassis_number}! You will be notified when it's ready.`, 
        type: 'success' 
      });
      
      // Remove the vehicle from the list to prevent duplicate requests
      setApprovedVehicles(prevVehicles => 
        prevVehicles.filter(v => v.id !== selectedVehicleId)
      );
      
      setSelectedVehicleId(''); // Reset form
      
      // Redirect to my-invoices after a short delay
      setTimeout(() => {
        router.push('/portal/dashboard/invoices/my-invoices');
      }, 3000);
      
    } catch (err) {
      console.error("Error submitting invoice request:", err);
      setSubmissionStatus({ 
        message: `Failed to submit invoice request: ${err.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-gray-600">Loading approved vehicles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Vehicles</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link
            href="/portal/dashboard/invoices/my-invoices"
            className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2"/>
            Back to My Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/portal/dashboard/invoices/my-invoices"
          className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2"/>
          Back to My Invoices
        </Link>
        <h1 className="text-2xl font-bold text-blue-900">Request New Invoice</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        {approvedVehicles.length > 0 ? (
          <form onSubmit={handleRequestSubmit} className="space-y-6">
            <p className="text-sm text-gray-600">
                You can request an invoice for vehicles that have been fully approved.
                Select a vehicle from the list below.
            </p>

            {submissionStatus.message && (
              <div className={`p-4 rounded-md border ${submissionStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex">
                  {submissionStatus.type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium">{submissionStatus.message}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Approved Vehicle *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <TruckIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                  id="vehicle-select"
                  name="vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    setSubmissionStatus({ message: '', type: '' }); // Clear status on change
                  }}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none"
                  required
                >
                  <option value="">-- Select a Vehicle --</option>
                  {approvedVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      Chassis: {vehicle.chassis_number}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || !selectedVehicleId}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Request Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <InformationCircleIcon className="mx-auto h-12 w-12 text-blue-400" />
            <p className="mt-4 text-lg font-medium text-gray-700">No Eligible Vehicles Found</p>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any approved vehicles without invoice requests. Please check your vehicle statuses or existing invoice requests.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/portal/dashboard/vehicles"
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors duration-200"
              >
                <TruckIcon className="h-5 w-5 mr-2"/>
                View My Vehicles
              </Link>
              <Link
                href="/portal/dashboard/invoices/my-invoices"
                className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2"/>
                Check My Invoices
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 