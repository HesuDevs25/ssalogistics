const [user, setUser] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [recentActivities, setRecentActivities] = useState([]);
const [totalCustomers, setTotalCustomers] = useState(0);
const [totalRequests, setTotalRequests] = useState(0);
const [totalDocuments, setTotalDocuments] = useState(0);

useEffect(() => {
  const checkStaffAccess = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/portal');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'staff') {
        router.push('/portal');
        return;
      }

      setUser({ ...user, profile });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error checking staff access:', error);
      router.push('/portal');
    } finally {
      setIsLoading(false);
    }
  };

  checkStaffAccess();
}, [router]);

// Remove notifications tab from the UI
<div className="flex space-x-4 mb-6">
  <button
    onClick={() => setActiveTab('overview')}
    className={`px-4 py-2 rounded-md ${
      activeTab === 'overview'
        ? 'bg-blue-900 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Overview
  </button>
  <button
    onClick={() => setActiveTab('documents')}
    className={`px-4 py-2 rounded-md ${
      activeTab === 'documents'
        ? 'bg-blue-900 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Documents
  </button>
</div> 