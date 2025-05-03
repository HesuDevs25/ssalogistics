"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { 
  ArrowDownTrayIcon, 
  DocumentMagnifyingGlassIcon, 
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function MyInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
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

        // Fetch user's invoices with vehicle information
        const { data, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id, 
            status, 
            request_date, 
            issue_date, 
            file_path,
            vehicles(chassis_number)
          `)
          .eq('user_id', user.id)
          .order('request_date', { ascending: false });
          
        if (invoicesError) throw invoicesError;
        
        setInvoices(data || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [router]);

  const handleDownload = async (invoice) => {
    if (invoice.status !== 'issued' || !invoice.file_path) {
      alert('This invoice is not available for download yet.');
      return;
    }

    try {
      // Get the public URL for the file
      const { data, error } = await supabase
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
      console.error("Unexpected error getting invoice URL:", err);
      alert("Unexpected error getting invoice URL.");
    }
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
      case 'issued':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
            Issued
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
            Rejected
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className="text-2xl font-bold text-blue-900">My Invoices</h1>
          <Link 
            href="/portal/dashboard/invoices/request" 
            className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2"/>
            Request New Invoice
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <p className="ml-4 text-gray-600">Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Invoices</h2>
            <p className="text-gray-700 mb-4">{error}</p>
          </div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Chassis</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                      {invoice.vehicles?.chassis_number || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.request_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleDownload(invoice)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded 
                          ${invoice.status === 'issued' && invoice.file_path 
                            ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}
                        disabled={invoice.status !== 'issued' || !invoice.file_path}
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
            <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-600">No Invoices Found</p>
            <p className="mt-1 text-sm text-gray-500">You haven't requested any invoices yet.</p>
            <Link 
              href="/portal/dashboard/invoices/request" 
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2"/>
              Request an Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 