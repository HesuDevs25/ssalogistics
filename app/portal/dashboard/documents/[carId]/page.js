"use client";
import { useState, useEffect } from "react";
import { use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CarDocumentsPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const carId = resolvedParams.carId;
  const [selectedDocType, setSelectedDocType] = useState("");
  const [documents, setDocuments] = useState([]);
  const [car, setCar] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const documentTypes = [
    { id: "billOfLading", name: "Bill of Lading" },
    { id: "commercialInvoice", name: "Commercial Invoice" },
    { id: "vehicleRegistration", name: "Vehicle Registration" }
  ];

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
        await fetchCar(carId);
        await fetchDocuments(user.id);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, carId]);

  const fetchCar = async (carId) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (error) {
        console.error('Error fetching car:', error);
        router.push('/portal/dashboard/documents');
        return;
      }
      
      setCar(data);
    } catch (error) {
      console.error('Error fetching car:', error);
      router.push('/portal/dashboard/documents');
    }
  };

  const fetchDocuments = async (userId) => {
    if (!userId || !carId) return;
    
    try {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('car_id', carId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      
      setDocuments(docs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDocType || !user || !carId) {
      alert('Please select a document type and file');
      return;
    }

    try {
      setIsLoading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${carId}/${selectedDocType}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      if (urlError) {
        console.error('URL error details:', urlError);
        throw new Error(`Failed to get public URL: ${urlError.message}`);
      }

      const { data: doc, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: user.id,
            car_id: carId,
            name: file.name,
            type: selectedDocType,
            file_url: publicUrl,
            file_path: fileName,
            status: 'pending',
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database error details:', dbError);
        throw new Error(`Failed to create document record: ${dbError.message}`);
      }

      setDocuments([doc, ...documents]);
      setSelectedDocType("");
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error.message || 'Error uploading document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setIsLoading(true);
      const doc = documents.find(d => d.id === docId);
      if (doc?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.file_path]);
        if (storageError) throw storageError;
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      setDocuments(documents.filter(d => d.id !== docId));
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document. Please try again.');
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">Car Documents</h2>
              <p className="text-gray-600 mt-1">Chassis Number: {car?.chassis_number}</p>
            </div>
            <Link
              href="/portal/dashboard/documents"
              className="flex items-center text-blue-900 hover:text-blue-800"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Cars
            </Link>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Upload Documents</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document Type *
                  </label>
                  <select
                    id="document-type"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 text-gray-900"
                    required
                  >
                    <option value="">Choose a document type</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-4 text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-900 hover:text-blue-800">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileUpload}
                        disabled={!selectedDocType}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                  {!selectedDocType && (
                    <p className="mt-2 text-sm text-red-600">Please select a document type before uploading</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-4">Documents</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {documentTypes.find(type => type.id === doc.type)?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm text-gray-900">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.type.toUpperCase()} • {doc.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === "verified" ? "bg-green-100 text-green-800" :
                          doc.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        {doc.status === "rejected" && doc.rejection_reason && (
                          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                            <p className="font-medium">Rejection Reason:</p>
                            <p className="mt-1">{doc.rejection_reason}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-blue-900 hover:text-blue-800 mr-4"
                          onClick={() => handleDownload(doc)}
                        >
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </span>
                        </button>
                        <button 
                          className="text-red-900 hover:text-red-800"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 