"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

export default function InvoiceRequestsPage() {
  const router = useRouter();
  const [invoiceRequests, setInvoiceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isUploading, setIsUploading] = useState({});

  useEffect(() => {
    fetchInvoiceRequests();
  }, []);

  const fetchInvoiceRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all invoice requests (status = 'requested')
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select(`
          id, 
          status, 
          request_date, 
          user_id,
          vehicles(id, chassis_number, user_id),
          profiles(name, email)
        `)
        .eq('status', 'requested')
        .order('request_date', { ascending: false });
        
      if (error) throw error;
      
      // Now fetch the profile information for each vehicle owner
      for (let i = 0; i < data.length; i++) {
        if (data[i].vehicles && data[i].vehicles.user_id) {
          const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', data[i].vehicles.user_id)
            .single();
            
          if (!profileError && profileData) {
            data[i].owner = profileData;
          }
        }
      }
      
      setInvoiceRequests(data || []);
    } catch (err) {
      console.error("Error fetching invoice requests:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3.5 w-3.5 mr-1" />
            Requested
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <ClockIcon className="h-3.5 w-3.5 mr-1" />
            Processing
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const handleFileChange = (invoiceId, e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({
        ...prev,
        [invoiceId]: file
      }));
    }
  };

  const handleIssueInvoice = async (invoiceId) => {
    if (!selectedFiles[invoiceId]) {
      alert('Please select an invoice PDF file to upload.');
      return;
    }

    const file = selectedFiles[invoiceId];
    
    if (file.type !== "application/pdf") {
      alert('Only PDF files are allowed.');
      return;
    }

    setIsUploading(prev => ({ ...prev, [invoiceId]: true }));

    try {
      // 1. Upload file to storage
      const filePath = `invoices/${invoiceId}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('invoices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Update invoice record with file path and change status to 'issued'
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'issued',
          issue_date: new Date().toISOString(),
          file_path: filePath
        })
        .eq('id', invoiceId);

      if (updateError) {
        throw updateError;
      }

      // 3. Update local state
      setInvoiceRequests(prev => 
        prev.filter(invoice => invoice.id !== invoiceId)
      );
      
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[invoiceId];
        return newState;
      });

      alert('Invoice issued successfully!');
    } catch (err) {
      console.error("Error issuing invoice:", err);
      alert(`Error issuing invoice: ${err.message}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-gray-600">Loading invoice requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Invoice Requests</h2>
        <p className="text-gray-700 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Invoice Requests</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        {invoiceRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Chassis</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Invoice</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceRequests.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                      {invoice.vehicles?.chassis_number || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.owner?.name || invoice.owner?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.request_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex flex-col space-y-2 items-center">
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            accept="application/pdf"
                            className="sr-only"
                            onChange={(e) => handleFileChange(invoice.id, e)}
                            disabled={isUploading[invoice.id]}
                          />
                          <span className={`inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm
                            ${selectedFiles[invoice.id] ? 'text-green-700 bg-green-50 border-green-300' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>
                            {selectedFiles[invoice.id] ? (
                              <>
                                <DocumentCheckIcon className="h-4 w-4 mr-1" />
                                PDF Selected
                              </>
                            ) : (
                              <>
                                <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                                Select PDF
                              </>
                            )}
                          </span>
                        </label>
                        
                        <button
                          onClick={() => handleIssueInvoice(invoice.id)}
                          disabled={!selectedFiles[invoice.id] || isUploading[invoice.id]}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm
                            ${!selectedFiles[invoice.id] || isUploading[invoice.id]
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                        >
                          {isUploading[invoice.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              Issuing...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Issue Invoice
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-600">No Invoice Requests</p>
            <p className="mt-1 text-sm text-gray-500">There are currently no pending invoice requests from users.</p>
          </div>
        )}
      </div>
    </div>
  );
} 