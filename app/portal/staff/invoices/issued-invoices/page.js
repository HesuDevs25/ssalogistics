"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function IssuedInvoicesPage() {
  const router = useRouter();
  const [issuedInvoices, setIssuedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssuedInvoices();
  }, []);

  const fetchIssuedInvoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all issued invoices
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select(`
          id, 
          status, 
          request_date, 
          issue_date,
          file_path,
          user_id,
          vehicles(id, chassis_number, user_id),
          profiles(name, email)
        `)
        .eq('status', 'issued')
        .order('issue_date', { ascending: false });
        
      if (error) throw error;
      
      // Fetch user profiles for each invoice
      for (let i = 0; i < data.length; i++) {
        if (data[i].user_id) {
          const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', data[i].user_id)
            .single();
            
          if (!profileError && profileData) {
            data[i].requester = profileData;
          }
        }
      }
      
      setIssuedInvoices(data || []);
    } catch (err) {
      console.error("Error fetching issued invoices:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = async (invoice) => {
    if (!invoice.file_path) {
      alert('No file available for this invoice.');
      return;
    }

    try {
      // Get the public URL for the file
      const { data, error } = await supabaseAdmin
        .storage
        .from('invoices')
        .getPublicUrl(invoice.file_path);

      if (error) {
        console.error("Error getting invoice URL:", error);
        alert("Could not get invoice URL.");
        return;
      }

      if (data?.publicUrl) {
        window.open(data.publicUrl, "_blank");
      } else {
        alert("Invoice file not found.");
      }
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert("Error downloading invoice.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-gray-600">Loading issued invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Invoices</h2>
        <p className="text-gray-700 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Issued Invoices</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        {issuedInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Chassis</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issuedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                      {invoice.vehicles?.chassis_number || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.requester?.name || invoice.requester?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.request_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-600">No Issued Invoices</p>
            <p className="mt-1 text-sm text-gray-500">There are currently no issued invoices.</p>
          </div>
        )}
      </div>
    </div>
  );
} 