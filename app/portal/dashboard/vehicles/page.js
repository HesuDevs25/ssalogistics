"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Enable the import
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// Helper function for status badge styling (reuse from home page)
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
    case 'approved': return <CheckCircleIcon className="h-4 w-4 mr-1 inline-block" />;
    case 'pending': return <ClockIcon className="h-4 w-4 mr-1 inline-block" />;
    case 'rejected': return <XCircleIcon className="h-4 w-4 mr-1 inline-block" />;
    case 'draft': return <ExclamationCircleIcon className="h-4 w-4 mr-1 inline-block" />;
    default: return null;
  }
};

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]); // New state for filtered vehicles
  const [searchQuery, setSearchQuery] = useState(''); // New state for search
  const [chassisNumber, setChassisNumber] = useState("");
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/portal');
          return;
        }

        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id); // Only fetch user's vehicles

        if (error) {
          setError(error.message);
          console.error("Error fetching vehicles:", error);
          setVehicles([]);
          setFilteredVehicles([]);
        } else {
          setVehicles(data || []);
          setFilteredVehicles(data || []); // Initialize filtered vehicles
        }
      } catch (err) {
        setError("Unexpected error fetching vehicles.");
        console.error("Unexpected error fetching vehicles:", err);
        setVehicles([]);
        setFilteredVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, [router]);

  // Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = vehicles.filter(vehicle => 
      vehicle.chassis_number.toLowerCase().includes(query)
    );
    setFilteredVehicles(filtered);
  }, [searchQuery, vehicles]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!chassisNumber.trim()) {
      alert('Please enter a valid chassis number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to add a vehicle.");
        return;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([
          {
            chassis_number: chassisNumber.trim().toUpperCase(),
            status: 'draft',
            documents_uploaded: 0,
            user_id: user.id
          }
        ])
        .select('id, chassis_number, status, documents_uploaded, user_id')
        .single();

      if (error) {
        setError(error.message);
        console.error("Error adding vehicle:", error);
        alert(`Error adding vehicle: ${error.message}`);
      } else {
        setVehicles(prevVehicles => [data, ...prevVehicles]);
        setChassisNumber("");
        setShowAddVehicleForm(false);
      }
    } catch (err) {
      setError("Unexpected error adding vehicle.");
      console.error("Unexpected error adding vehicle:", err);
      alert("Unexpected error adding vehicle.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-red-600">{`Error: ${error}`}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl font-bold text-blue-900">My Vehicles</h2>
          <button
            onClick={() => setShowAddVehicleForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2"/>
            Add New Vehicle
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by chassis number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Add Vehicle Form */}
        {showAddVehicleForm && (
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6 border border-gray-200"> {/* Improved styling */}
            <form onSubmit={handleAddVehicle} className="space-y-4">
               <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-3">Add a New Vehicle</h3>
              <div>
                <label htmlFor="chassis-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Chassis Number *
                </label>
                <input
                  type="text"
                  id="chassis-number"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter chassis number"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVehicleForm(false);
                    setChassisNumber(""); // Clear input on cancel
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-900 border border-transparent rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vehicle List */}
        <div className="space-y-4">
          {filteredVehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/portal/dashboard/vehicles/${vehicle.id}`}
              className="block p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Chassis: {vehicle.chassis_number}</h3>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0 text-xs">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeClass(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    {vehicle.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-800">
                    {vehicle.documents_uploaded} / 3 Docs
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State - Modified to handle search */}
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 border-t mt-6">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            {searchQuery ? (
              <>
                <p className="mt-4 text-lg font-medium text-gray-600">No vehicles match your search.</p>
                <p className="mt-1 text-sm text-gray-500">Try a different chassis number.</p>
              </>
            ) : (
              <>
                <p className="mt-4 text-lg font-medium text-gray-600">No vehicles added yet.</p>
                <p className="mt-1 text-sm text-gray-500">Click "Add New Vehicle" to get started.</p>
                <button
                  onClick={() => setShowAddVehicleForm(true)}
                  className="mt-6 inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2"/>
                  Add First Vehicle
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 