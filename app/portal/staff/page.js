"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useRouter } from "next/navigation";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("agents");
  const [documents, setDocuments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check user authentication and fetch data
  useEffect(() => {
    const checkUserAndFetchData = async () => {
      try {
        // Check if user is staff
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Auth error:', authError);
          router.push('/portal');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'staff') {
          console.error('Profile error:', profileError);
          router.push('/portal');
          return;
        }

        setUser({ ...user, profile });
        await fetchAgents();
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/portal');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndFetchData();
  }, [router]);

  const fetchAgents = async () => {
    try {
      const { data: docs, error } = await supabaseAdmin
        .from('documents')
        .select(`
          *,
          profiles!inner (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      // Group documents by agent and calculate counts
      const agentMap = new Map();
      docs.forEach(doc => {
        const agentId = doc.profiles.id;
        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            id: agentId,
            name: doc.profiles.name,
            email: doc.profiles.email,
            documents: [],
            counts: {
              pending: 0,
              verified: 0,
              rejected: 0
            }
          });
        }
        const agent = agentMap.get(agentId);
        agent.documents.push(doc);
        agent.counts[doc.status]++;
      });

      setAgents(Array.from(agentMap.values()));
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleStatusChange = async (documentId, newStatus) => {
    try {
      const { error } = await supabaseAdmin
        .from('documents')
        .update({ status: newStatus })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(documents.map(doc => 
        doc.id === documentId ? { ...doc, status: newStatus } : doc
      ));

      // Update agent counts
      setAgents(agents.map(agent => {
        const doc = agent.documents.find(d => d.id === documentId);
        if (doc) {
          const oldStatus = doc.status;
          return {
            ...agent,
            counts: {
              ...agent.counts,
              [oldStatus]: agent.counts[oldStatus] - 1,
              [newStatus]: agent.counts[newStatus] + 1
            },
            documents: agent.documents.map(d => 
              d.id === documentId ? { ...d, status: newStatus } : d
            )
          };
        }
        return agent;
      }));

      // Send notification to user
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        await supabaseAdmin
          .from('notifications')
          .insert([
            {
              type: 'document_status',
              title: 'Document Status Updated',
              message: `Your document "${doc.name}" has been ${newStatus}`,
              recipient_email: doc.profiles.email,
              document_id: doc.id,
            },
          ]);
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status');
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-900">Staff Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/portal')}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Portal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("agents")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "agents"
                    ? "border-blue-900 text-blue-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Agents
              </button>
              {selectedAgent && (
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "documents"
                      ? "border-blue-900 text-blue-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {selectedAgent.name}&apos;s Documents
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {activeTab === "agents" ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rejected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-700 text-lg">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {agent.counts.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {agent.counts.verified}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {agent.counts.rejected}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setActiveTab("documents");
                        }}
                        className="text-blue-900 hover:text-blue-800"
                      >
                        View Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedAgent.name}&apos;s Documents
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedAgent(null);
                      setActiveTab("agents");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Back to Agents
                  </button>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedAgent.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.type.toUpperCase()} • {doc.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                          doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-900 hover:text-blue-800 mr-4"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          View
                        </button>
                        {doc.status === "pending" && (
                          <>
                            <button
                              className="text-green-900 hover:text-green-800 mr-4"
                              onClick={() => handleStatusChange(doc.id, "verified")}
                            >
                              Verify
                            </button>
                            <button
                              className="text-red-900 hover:text-red-800"
                              onClick={() => handleStatusChange(doc.id, "rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 