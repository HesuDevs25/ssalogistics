"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function StatusPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activationStatus, setActivationStatus] = useState(null);

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

        setUser({ ...user, profile });
        await checkActivationRequests(user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const checkActivationRequests = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('account_activation_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching activation requests:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setActivationStatus(data[0]);
      }
    } catch (error) {
      console.error('Error fetching activation requests:', error);
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
          <h2 className="text-xl font-bold text-blue-900 mb-4">Document Status</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Current Status</h3>
              <p className="text-gray-600">Your documents are being reviewed by our verification team.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Next Steps</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Wait for document verification</li>
                <li>Check for any feedback or requests for additional documents</li>
                <li>Schedule a visit once all documents are verified</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 