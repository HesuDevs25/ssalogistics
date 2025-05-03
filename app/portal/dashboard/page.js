"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TruckIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() { 
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [vehicleStats, setVehicleStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    draft: 0
  });
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    issued: 0,
    requested: 0
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error('Auth error:', error);
          router.push('/portal');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Profile fetch warning:', profileError.message);
          setUser({ ...user, profile: null });
        } else {
          setUser({ ...user, profile });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router]);

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user?.id) return;
      
      setVehiclesLoading(true);
      try {
        // Get all user's vehicles for stats
        const { data: allVehicles, error: statsError } = await supabase
          .from('vehicles')
          .select('id, status')
          .eq('user_id', user.id);
          
        if (statsError) {
          console.error('Error fetching vehicle stats:', statsError);
        } else {
          // Calculate stats
          const stats = {
            total: allVehicles.length,
            approved: allVehicles.filter(v => v.status === 'approved').length,
            pending: allVehicles.filter(v => v.status === 'pending').length,
            rejected: allVehicles.filter(v => v.status === 'rejected').length,
            draft: allVehicles.filter(v => v.status === 'draft').length
          };
          setVehicleStats(stats);
        }

        // Get the 3 most recent vehicles for display
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) {
          console.error('Error fetching recent vehicles:', error);
          setVehicles([]);
        } else {
          setVehicles(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching vehicles:', err);
        setVehicles([]);
      } finally {
        setVehiclesLoading(false);
      }
    };

    if (user?.id) {
      fetchVehicles();
    }
  }, [user]);

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) return;
      
      setInvoicesLoading(true);
      try {
        // Get all user's invoices for stats
        const { data: allInvoices, error: statsError } = await supabase
          .from('invoices')
          .select('id, status')
          .eq('user_id', user.id);
          
        if (statsError) {
          console.error('Error fetching invoice stats:', statsError);
        } else {
          // Calculate stats
          const stats = {
            total: allInvoices.length,
            issued: allInvoices.filter(i => i.status === 'issued').length,
            requested: allInvoices.filter(i => i.status === 'requested').length
          };
          setInvoiceStats(stats);
        }

        // Get the 3 most recent invoices
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id, 
            status, 
            request_date, 
            issue_date,
            vehicle_id,
            vehicles(chassis_number)
          `)
          .eq('user_id', user.id)
          .order('request_date', { ascending: false })
          .limit(3);
          
        if (error) {
          console.error('Error fetching recent invoices:', error);
          setInvoices([]);
        } else {
          setInvoices(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching invoices:', err);
        setInvoices([]);
      } finally {
        setInvoicesLoading(false);
      }
    };

    if (user?.id) {
      fetchInvoices();
    }
  }, [user]);

  if (isLoading || vehiclesLoading || invoicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'issued': return 'bg-green-100 text-green-800';
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-4 w-4 mr-1 inline-block" />;
      case 'pending': return <ClockIcon className="h-4 w-4 mr-1 inline-block" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4 mr-1 inline-block" />;
      case 'draft': return <ExclamationCircleIcon className="h-4 w-4 mr-1 inline-block" />;
      case 'issued': return <CheckCircleIcon className="h-4 w-4 mr-1 inline-block" />;
      case 'requested': return <ClockIcon className="h-4 w-4 mr-1 inline-block" />;
      default: return null;
    }
  };

  // Function to count vehicle documents
  const getDocumentCount = (vehicle) => {
    let count = 0;
    if (vehicle.registration_doc) count++;
    if (vehicle.insurance_doc) count++;
    if (vehicle.ownership_doc) count++;
    return count;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{user?.profile?.name || 'N/A'}</span>
                </p>
                <p className="text-gray-700 flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{user?.email}</span>
                </p>
                <p className="text-gray-700 flex justify-between">
                  <span className="font-medium">Company:</span>
                  <span>{user?.profile?.company || 'N/A'}</span>
                </p>
                <p className="text-gray-700 flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    user?.profile?.account_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.profile?.account_status
                      ? user.profile.account_status.charAt(0).toUpperCase() + user.profile.account_status.slice(1)
                      : 'Pending'}
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
               <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Status</h3>
               <div className="space-y-2 text-sm">
                 <p className="text-gray-700 flex justify-between">
                   <span className="font-medium">Total Vehicles:</span> {vehicleStats.total}
                 </p>
                 <p className="text-green-700 flex justify-between">
                   <span className="font-medium">Approved:</span> {vehicleStats.approved}
                 </p>
                 <p className="text-yellow-700 flex justify-between">
                   <span className="font-medium">Pending Review:</span> {vehicleStats.pending}
                 </p>
                 <p className="text-red-700 flex justify-between">
                   <span className="font-medium">Rejected:</span> {vehicleStats.rejected}
                 </p>
                 <p className="text-gray-700 flex justify-between">
                   <span className="font-medium">Draft:</span> {vehicleStats.draft}
                 </p>
               </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
               <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Overview</h3>
               <div className="space-y-2 text-sm">
                 <p className="text-gray-700 flex justify-between">
                   <span className="font-medium">Total Invoices:</span> {invoiceStats.total}
                 </p>
                 <p className="text-green-700 flex justify-between">
                   <span className="font-medium">Issued:</span> {invoiceStats.issued}
                 </p>
                 <p className="text-yellow-700 flex justify-between">
                   <span className="font-medium">Requested:</span> {invoiceStats.requested}
                 </p>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold text-blue-900">My Vehicles</h2>
            <Link
              href="/portal/dashboard/vehicles"
              className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
            >
              <TruckIcon className="h-5 w-5 mr-2"/>
              Manage Vehicles
            </Link>
          </div>
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/portal/dashboard/vehicles/${vehicle.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                   <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Chassis: {vehicle.chassis_number}</h3>
                      <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                   </div>
                   <div className="flex items-center space-x-2 mt-2 sm:mt-0 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeClass(vehicle.status)}`}>
                         {getStatusIcon(vehicle.status)}
                         {vehicle.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-800">
                        {getDocumentCount(vehicle)} / 3 Docs
                      </span>
                   </div>
                 </div>
              </Link>
            ))}
          </div>
          {vehicles.length === 0 && (
            <div className="text-center py-12 border-t mt-6">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-600">No vehicles added yet.</p>
              <p className="mt-1 text-sm text-gray-500">Add your first vehicle to start the document process.</p>
              <Link
                href="/portal/dashboard/vehicles"
                className="mt-6 inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                Add First Vehicle
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold text-blue-900">My Invoices</h2>
            <Link
              href="/portal/dashboard/invoices/my-invoices"
              className="inline-flex items-center px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
            >
              <CurrencyDollarIcon className="h-5 w-5 mr-2"/>
              View All Invoices
            </Link>
          </div>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/portal/dashboard/invoices/my-invoices`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                   <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Vehicle: {invoice.vehicles?.chassis_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(invoice.request_date).toLocaleDateString()}
                      </p>
                   </div>
                   <div className="flex items-center space-x-2 mt-2 sm:mt-0 text-xs">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeClass(invoice.status)}`}>
                         {getStatusIcon(invoice.status)}
                         {invoice.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                   </div>
                 </div>
              </Link>
            ))}
          </div>
          {invoices.length === 0 && (
            <div className="text-center py-12 border-t mt-6">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-600">No invoices found.</p>
              <p className="mt-1 text-sm text-gray-500">Invoices will appear once they are issued for your approved vehicles.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/portal/dashboard/vehicles"
              className="group p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 text-center flex flex-col items-center justify-center h-32"
            >
              <TruckIcon className="w-8 h-8 mx-auto text-blue-900 group-hover:scale-110 transition-transform" />
              <p className="mt-2 font-medium text-gray-900">Manage Vehicles</p>
            </Link>
            <Link
              href="/portal/dashboard/profile"
              className="group p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 text-center flex flex-col items-center justify-center h-32"
            >
              <UserCircleIcon className="w-8 h-8 mx-auto text-blue-900 group-hover:scale-110 transition-transform" />
              <p className="mt-2 font-medium text-gray-900">Profile Settings</p>
            </Link>
            <Link
              href="/portal/dashboard/invoices/my-invoices"
              className="group p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 text-center flex flex-col items-center justify-center h-32"
            >
              <CurrencyDollarIcon className="w-8 h-8 mx-auto text-blue-900 group-hover:scale-110 transition-transform" />
              <p className="mt-2 font-medium text-gray-900">View Invoices</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 