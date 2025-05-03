"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UserCircleIcon, BuildingOffice2Icon, ArrowUpTrayIcon, DocumentCheckIcon, XCircleIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [authLetter, setAuthLetter] = useState(null);
  const [idDocument, setIdDocument] = useState(null);
  const [activationStatus, setActivationStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error('Auth error:', error?.message || 'No user found');
          router.push('/portal');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError.message);
          setUser({ ...user, profile: null });
        } else {
          setUser({ ...user, profile });
          await checkActivationRequests(user.id);
        }
      } catch (error) {
        console.error('Auth check error:', error.message);
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
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error fetching activation requests:', error.message);
        setActivationStatus(null);
        return;
      }

      if (data && data.length > 0) {
        setActivationStatus(data[0]);
      } else {
        setActivationStatus(null);
      }
    } catch (error) {
      console.error('Error fetching activation requests catch:', error.message);
      setActivationStatus(null);
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
    if (!companyName || !authLetter || !idDocument || !user) {
      alert('Please fill in all fields and upload required documents');
      return;
    }

    setIsSubmitting(true);
    try {
      const authLetterExt = authLetter.name.split('.').pop();
      const authLetterPath = `${user.id}/auth-letter/${Date.now()}.${authLetterExt}`;
      const { error: authLetterError } = await supabase.storage
        .from('verification-docs')
        .upload(authLetterPath, authLetter);
      if (authLetterError) throw new Error(`Auth Letter Upload Failed: ${authLetterError.message}`);

      const idDocExt = idDocument.name.split('.').pop();
      const idDocPath = `${user.id}/id-document/${Date.now()}.${idDocExt}`;
      const { error: idDocError } = await supabase.storage
        .from('verification-docs')
        .upload(idDocPath, idDocument);
      if (idDocError) throw new Error(`ID Document Upload Failed: ${idDocError.message}`);

      const { data: request, error: requestError } = await supabase
        .from('account_activation_requests')
        .insert({
          company_name: companyName,
          auth_letter_path: authLetterPath,
          id_document_path: idDocPath,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw new Error(`Request Submission Failed: ${requestError.message}`);

      setActivationStatus(request);
      setShowActivationForm(false);
      alert('Account activation request submitted successfully! It is now pending review.');
    } catch (error) {
      console.error('Error submitting activation request:', error);
      if (error.message.includes('Request Submission Failed')) {
        if (authLetterPath) await supabase.storage.from('verification-docs').remove([authLetterPath]);
        if (idDocPath) await supabase.storage.from('verification-docs').remove([idDocPath]);
      }
      alert(`Error: ${error.message || 'Failed to submit request. Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReapply = () => {
    setCompanyName('');
    setAuthLetter(null);
    setIdDocument(null);
    setActivationStatus(null);
    setShowActivationForm(true);
  };

  const FileInput = ({ id, label, file, onChange, type }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
      <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${file ? 'border-blue-300' : 'border-gray-300'} border-dashed rounded-md`}>
        <div className="space-y-1 text-center">
          {file ? (
            <div className="text-sm text-gray-700 flex flex-col items-center">
              <DocumentCheckIcon className="h-10 w-10 text-green-500 mb-1"/>
              <p className="font-medium truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</p>
              <button
                type="button"
                onClick={() => {
                  if (type === 'authLetter') setAuthLetter(null);
                  else if (type === 'idDocument') setIdDocument(null);
                  document.getElementById(id).value = null;
                }}
                className="mt-2 text-xs font-medium text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-gray-400"/>
              <div className="flex text-sm text-gray-600 justify-center">
                <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload a file</span>
                  <input id={id} name={id} type="file" className="sr-only" onChange={(e) => handleFileSelect(e, type)} required />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOC(X), JPG, PNG up to 10MB</p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        <p className="ml-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const needsActivation = !user?.profile?.account_status || user?.profile?.account_status === 'disabled' || user?.profile?.account_status === 'pending_activation';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 border-b pb-3">Your Profile</h1>
        {user ? (
          <div className="space-y-8">
            <section>
               <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
                  <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-800 text-3xl font-bold shadow-sm">
                    {user.profile?.name ? user.profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{user.profile?.name || 'Name Not Set'}</h2>
                    <p className="text-gray-600 text-sm md:text-base">{user.email}</p>
                    <p className="text-gray-500 text-xs mt-1">
                       Member since: {
                         user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString() :
                         user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
                       }
                     </p>
                  </div>
                  <div className="text-sm">
                       <span className="font-medium text-gray-500 block mb-1">Account Status:</span>
                       <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold ${ 
                           user.profile?.account_status === 'active' ? 'bg-green-100 text-green-800' :
                           user.profile?.account_status === 'pending' || user.profile?.account_status === 'pending_activation' ? 'bg-yellow-100 text-yellow-800' :
                           user.profile?.account_status === 'disabled' ? 'bg-red-100 text-red-800' :
                           'bg-gray-100 text-gray-800'
                       }`}>
                          {user.profile?.account_status ? user.profile.account_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
                       </span>
                  </div>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm border-t pt-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact</h3>
                        <p><span className="font-medium text-gray-700">Email:</span> {user.email}</p>
                        <p><span className="font-medium text-gray-700">Phone:</span> {user.profile?.phone || <span className="italic text-gray-400">Not provided</span>}</p>
                    </div>
                </div>
            </section>

            {needsActivation && (
              <section className="mt-8 border-t pt-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Account Activation</h2>

                {showActivationForm ? (
                  <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg shadow-inner">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Activation Request</h3>
                    <form onSubmit={handleActivationRequest} className="space-y-5">
                      <div>
                        <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                        <div className="relative rounded-md shadow-sm">
                           <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <BuildingOffice2Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                           </div>
                           <input
                              type="text"
                              id="company-name"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              placeholder="Your Company Name LLC"
                              required
                            />
                        </div>
                      </div>

                      <FileInput id="auth-letter-upload" label="Authorization Letter" file={authLetter} onChange={handleFileSelect} type="authLetter" />
                      <FileInput id="id-document-upload" label="ID or Passport" file={idDocument} onChange={handleFileSelect} type="idDocument" />

                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowActivationForm(false);
                            setCompanyName(''); setAuthLetter(null); setIdDocument(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-900 border border-transparent rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                          disabled={isSubmitting || !companyName || !authLetter || !idDocument}
                        >
                          {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                              </>
                          ) : 'Submit Request'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : activationStatus ? (
                  <div className={`p-4 rounded-md border ${activationStatus.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : activationStatus.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {activationStatus.status === 'pending' && <ClockIcon className="h-5 w-5 text-yellow-400" />}
                        {activationStatus.status === 'rejected' && <XCircleIcon className="h-5 w-5 text-red-400" />}
                      </div>
                      <div className="ml-3 flex-grow">
                        <h3 className="text-sm font-medium">
                          Activation Request Status: <span className="font-semibold">{activationStatus.status.replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </h3>
                        <div className="mt-2 text-sm">
                          {activationStatus.status === 'rejected' ? (
                            <>
                              <p>Your request was rejected. Reason: <span className="italic">{activationStatus.notes || 'No specific reason provided.'}</span></p>
                            </>
                          ) : activationStatus.status === 'pending' ? (
                            <p>Your request is under review. You'll be notified via email once a decision is made.</p>
                          ) : (
                             <p>Status: {activationStatus.status}</p>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Submitted on: {new Date(activationStatus.created_at).toLocaleString()}</p>
                      </div>
                      {activationStatus.status === 'rejected' && (
                          <div className="ml-auto pl-3">
                               <button
                                  onClick={handleReapply}
                                  className="whitespace-nowrap inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Reapply
                               </button>
                          </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center bg-gray-50 p-6 rounded-lg border border-gray-200">
                     <InformationCircleIcon className="h-10 w-10 text-blue-500 mx-auto mb-3"/>
                    <p className="text-gray-700 mb-4 text-base">Your account requires activation to access all features, including vehicle document management.</p>
                    <button
                      onClick={() => setShowActivationForm(true)}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start Activation Process
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-700 text-center font-medium">Could not load user profile information.</p>
          </div>
        )}
      </div>
    </div>
  );
} 