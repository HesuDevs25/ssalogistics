"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

export default function NewInvoicePage() {
  const router = useRouter();
  const [chassisNumber, setChassisNumber] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allApprovedVehicles, setAllApprovedVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [file, setFile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch all approved vehicles on page load
  useEffect(() => {
    fetchAllApprovedVehicles();
  }, []);

  const fetchAllApprovedVehicles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all vehicles with status = 'approved'
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select(`
          id, 
          chassis_number, 
          status,
          user_id,
          profiles(id, name, email)
        `)
        .eq('status', 'approved');
        
      if (error) throw error;
      
      // Check which vehicles already have invoices
      const vehicleIds = data.map(v => v.id);
      if (vehicleIds.length > 0) {
        const { data: existingInvoices, error: invoicesError } = await supabaseAdmin
          .from('invoices')
          .select('vehicle_id')
          .in('vehicle_id', vehicleIds);
          
        if (invoicesError) throw invoicesError;
        
        // Filter out vehicles that already have invoices
        const existingVehicleIds = new Set(existingInvoices.map(i => i.vehicle_id));
        const availableVehicles = data.filter(v => !existingVehicleIds.has(v.id));
        
        setAllApprovedVehicles(availableVehicles);
      } else {
        setAllApprovedVehicles([]);
      }
    } catch (err) {
      console.error("Error fetching approved vehicles:", err);
      setError("Failed to load approved vehicles: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!chassisNumber.trim()) {
      setError("Please enter a chassis number to search");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedVehicle(null);

    try {
      // Filter the already fetched approved vehicles by chassis number
      const filtered = allApprovedVehicles.filter(vehicle => 
        vehicle.chassis_number.toLowerCase().includes(chassisNumber.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch (err) {
      console.error("Error searching vehicles:", err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        setFile(null);
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setError(null);
    // Clear search results to show we're working with the selected vehicle
    setSearchResults([]);
    setChassisNumber('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle) {
      setError("Please select a vehicle");
      return;
    }
    
    if (!file) {
      setError("Please upload an invoice PDF");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // First check if invoice already exists for this vehicle
      const { data: existingInvoice, error: checkError } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .eq('vehicle_id', selectedVehicle.id)
        .single();
        
      if (!checkError && existingInvoice) {
        throw new Error("An invoice already exists for this vehicle");
      }

      // 1. Upload file to storage
      const filePath = `invoices/${selectedVehicle.id}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('invoices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Create invoice record
      const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert([{
          vehicle_id: selectedVehicle.id,
          user_id: selectedVehicle.user_id,
          status: 'issued',
          request_date: new Date().toISOString(), // For direct issuance, request date is the same as issue date
          issue_date: new Date().toISOString(),
          file_path: filePath
        }]);

      if (invoiceError) throw invoiceError;

      setSuccess(`Invoice issued successfully for vehicle with chassis number ${selectedVehicle.chassis_number}`);
      setFile(null);
      setSelectedVehicle(null);
      // Update the available vehicles list
      await fetchAllApprovedVehicles();
      
      // Redirect to issued invoices page after a delay
      setTimeout(() => {
        router.push('/portal/staff/invoices/issued-invoices');
      }, 2000);
    } catch (err) {
      console.error("Error issuing invoice:", err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const renderVehiclesTable = (vehicles, title, emptyMessage) => {
    if (vehicles.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr 
                key={vehicle.id} 
                className={selectedVehicle?.id === vehicle.id ? "bg-blue-50" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                  {vehicle.chassis_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vehicle.profiles?.name || vehicle.profiles?.email || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <button
                    onClick={() => handleSelectVehicle(vehicle)}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      selectedVehicle?.id === vehicle.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {selectedVehicle?.id === vehicle.id ? 'Selected' : 'Select'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/portal/staff/invoices/issued-invoices"
          className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2"/>
          Back to Issued Invoices
        </Link>
        <h1 className="text-2xl font-bold text-blue-900">Create New Invoice</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {success && (
          <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <p className="ml-4 text-gray-600">Loading approved vehicles...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Find a Vehicle</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <div className="relative">
                    <input
                      type="text"
                      value={chassisNumber}
                      onChange={(e) => setChassisNumber(e.target.value)}
                      placeholder="Search by chassis number"
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !chassisNumber.trim()}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Search Results</h2>
                {renderVehiclesTable(searchResults, "Search Results", "No vehicles found matching your search.")}
              </div>
            )}
            
            {searchResults.length === 0 && chassisNumber && !isSearching && (
              <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                <p className="text-gray-600">No vehicles found matching this chassis number.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try a different search or select from the list of approved vehicles below.
                </p>
              </div>
            )}
            
            {!selectedVehicle && searchResults.length === 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">All Approved Vehicles</h2>
                  <div className="text-sm text-gray-500">
                    {allApprovedVehicles.length} {allApprovedVehicles.length === 1 ? 'vehicle' : 'vehicles'} available
                  </div>
                </div>
                {renderVehiclesTable(
                  allApprovedVehicles, 
                  "All Approved Vehicles", 
                  "No approved vehicles available for invoicing. Vehicles must be approved and not have an existing invoice."
                )}
              </div>
            )}
            
            {selectedVehicle && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Vehicle</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900">Chassis: <span className="font-mono">{selectedVehicle.chassis_number}</span></p>
                    <p className="text-sm text-gray-600 mt-1">Owner: {selectedVehicle.profiles?.name || selectedVehicle.profiles?.email || 'Unknown'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedVehicle(null)} 
                    className="text-sm text-blue-700 hover:text-blue-900"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
            
            {selectedVehicle && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Invoice PDF</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <input
                    type="file"
                    id="invoice-file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label 
                    htmlFor="invoice-file" 
                    className="cursor-pointer inline-flex flex-col items-center justify-center"
                  >
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-900">
                      {file ? file.name : "Click to upload PDF invoice"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Only PDF files are accepted</span>
                  </label>
                  {file && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-green-600">
                        ✓ File selected: {file.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedVehicle && file && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Issuing Invoice...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Issue Invoice
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 