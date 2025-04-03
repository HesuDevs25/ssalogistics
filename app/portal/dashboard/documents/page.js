"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DocumentsPage() {
  const router = useRouter();
  const [cars, setCars] = useState([]);
  const [chassisNumber, setChassisNumber] = useState("");
  const [showAddCarForm, setShowAddCarForm] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
          console.error('Profile fetch error:', profileError);
          router.push('/portal');
          return;
        }

        if (profile.account_status !== 'active') {
          router.push('/portal/dashboard/profile');
          return;
        }

        setUser({ ...user, profile });
        await fetchCars(user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchCars = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
        return;
      }
      
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!chassisNumber || !user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .insert([{
          user_id: user.id,
          chassis_number: chassisNumber
        }])
        .select()
        .single();

      if (error) throw error;

      setCars([data, ...cars]);
      setChassisNumber("");
      setShowAddCarForm(false);
    } catch (error) {
      console.error('Error adding car:', error);
      alert('Error adding car. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">Your Cars</h2>
            <button
              onClick={() => setShowAddCarForm(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors duration-200"
            >
              Add New Car
            </button>
          </div>

          {showAddCarForm && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <form onSubmit={handleAddCar} className="space-y-4">
                <div>
                  <label htmlFor="chassis-number" className="block text-sm font-medium text-gray-700">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    id="chassis-number"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
                    placeholder="Enter chassis number"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCarForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
                  >
                    Add Car
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car) => (
              <Link
                key={car.id}
                href={`/portal/dashboard/documents/${car.id}`}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-900 hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Chassis Number</h3>
                    <p className="text-gray-600">{car.chassis_number}</p>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 