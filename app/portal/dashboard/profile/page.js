"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [authLetter, setAuthLetter] = useState(null);
  const [idDocument, setIdDocument] = useState(null);
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

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === 'authLetter') {
      setAuthLetter(file);
    } else if (type === 'idDocument') {
      setIdDocument(file);
    }
  };

  const handleActivationRequest = async (e) => {
    e.preventDefault();
    
    if (!companyName || !authLetter || !idDocument) {
      alert('Please fill in all fields and upload required documents');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Upload authorization letter
      const authLetterExt = authLetter.name.split('.').pop();
      const authLetterPath = `${user.id}/auth-letter/${Date.now()}.${authLetterExt}`;
      
      const { error: authLetterError } = await supabase.storage
        .from('verification-docs')
        .upload(authLetterPath, authLetter, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (authLetterError) {
        console.error('Upload error:', authLetterError);
        throw new Error(`Failed to upload authorization letter: ${authLetterError.message}`);
      }
      
      // Upload ID document
      const idDocExt = idDocument.name.split('.').pop();
      const idDocPath = `${user.id}/id-document/${Date.now()}.${idDocExt}`;
      
      const { error: idDocError } = await supabase.storage
        .from('verification-docs')
        .upload(idDocPath, idDocument, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (idDocError) {
        console.error('Upload error:', idDocError);
        throw new Error(`Failed to upload ID document: ${idDocError.message}`);
      }
      
      // Create activation request
      const { data: request, error: requestError } = await supabase
        .from('account_activation_requests')
        .insert([{
          user_id: user.id,
          company_name: companyName,
          auth_letter_path: authLetterPath,
          id_document_path: idDocPath,
          status: 'pending'
        }])
        .select()
        .single();
        
      if (requestError) {
        console.error('Database error:', requestError);
        throw new Error(`Failed to create activation request: ${requestError.message}`);
      }
      
      setActivationStatus(request);
      setShowActivationForm(false);
      alert('Your account activation request has been submitted and is pending review.');
      
    } catch (error) {
      console.error('Error submitting activation request:', error);
      alert(error.message || 'Error submitting request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReapply = () => {
    // Reset form state
    setCompanyName('');
    setAuthLetter(null);
    setIdDocument(null);
    setShowActivationForm(true);
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
          <h2 className="text-xl font-bold text-blue-900 mb-4">Your Profile</h2>
          {user?.profile ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-2xl font-bold mr-4">
                    {user.profile.name ? user.profile.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{user.profile.name || 'N/A'}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Contact Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Email</span>
                        <span className="block text-gray-900">{user.email}</span>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Phone</span>
                        <span className="block text-gray-900">{user.profile.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Account Details</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Member Since</span>
                        <span className="block text-gray-900">
                          {user.profile.created_at 
                            ? new Date(user.profile.created_at).toLocaleDateString() 
                            : new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Account Status</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.profile.account_status === 'active' ? 'bg-green-100 text-green-800' :
                          user.profile.account_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.profile.account_status ? user.profile.account_status.charAt(0).toUpperCase() + user.profile.account_status.slice(1) : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Activation Section */}
                {(user.profile.account_status === 'disabled' || !user.profile.account_status) && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Account Activation</h4>
                    
                    {showActivationForm ? (
                      <div className="bg-white p-4 border rounded-md">
                        <h3 className="font-medium text-lg text-gray-900 mb-4">Account Activation Request</h3>
                        <form onSubmit={handleActivationRequest} className="space-y-4">
                          <div>
                            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                            <input
                              type="text"
                              id="company-name"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your company name"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="auth-letter" className="block text-sm font-medium text-gray-700 mb-1">Authorization Letter *</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                              <div className="space-y-1 text-center">
                                {authLetter ? (
                                  <div className="text-sm text-gray-600">
                                    <p>Selected file: {authLetter.name}</p>
                                    <button 
                                      type="button"
                                      onClick={() => setAuthLetter(null)}
                                      className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                      <label htmlFor="auth-letter-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-900 hover:text-blue-800">
                                        <span>Upload a file</span>
                                        <input 
                                          id="auth-letter-upload" 
                                          name="auth-letter-upload" 
                                          type="file" 
                                          className="sr-only"
                                          onChange={(e) => handleFileSelect(e, 'authLetter')} 
                                        />
                                      </label>
                                      <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="id-document" className="block text-sm font-medium text-gray-700 mb-1">ID or Passport *</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                              <div className="space-y-1 text-center">
                                {idDocument ? (
                                  <div className="text-sm text-gray-600">
                                    <p>Selected file: {idDocument.name}</p>
                                    <button 
                                      type="button"
                                      onClick={() => setIdDocument(null)}
                                      className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                      <label htmlFor="id-document-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-900 hover:text-blue-800">
                                        <span>Upload a file</span>
                                        <input 
                                          id="id-document-upload" 
                                          name="id-document-upload" 
                                          type="file" 
                                          className="sr-only"
                                          onChange={(e) => handleFileSelect(e, 'idDocument')} 
                                        />
                                      </label>
                                      <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowActivationForm(false);
                                setCompanyName('');
                                setAuthLetter(null);
                                setIdDocument(null);
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-900 border border-transparent rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Submit Request
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : activationStatus ? (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Activation Request Status: {activationStatus.status.charAt(0).toUpperCase() + activationStatus.status.slice(1)}</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              {activationStatus.status === 'rejected' ? (
                                <>
                                  <p>Your account activation request was rejected. Reason: {activationStatus.notes}</p>
                                  <button 
                                    onClick={handleReapply}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Reapply for Activation
                                  </button>
                                </>
                              ) : (
                                <p>Your account activation request has been submitted and is {activationStatus.status}. You will be notified once it has been reviewed.</p>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-blue-500">Submitted on {new Date(activationStatus.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-4">Your account needs to be activated before you can fully access all features.</p>
                        <button 
                          onClick={() => setShowActivationForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Request Activation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Unable to load profile information.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 