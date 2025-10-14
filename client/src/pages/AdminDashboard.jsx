import React, { useState, useEffect, useContext } from 'react';
import { 
  Users, 
  BookOpen, 
  ArrowLeftRight, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Shield,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Settings,
  HelpCircle,
  Bell,
  Plus,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  MessageSquare,
  UserCheck,
  Zap,
  Globe,
  Database,
  FileText,
  PieChart,
  BarChart,
  LineChart
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { adminAPIService } from '../utils/adminAPI';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [bookClubs, setBookClubs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabErrors, setTabErrors] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Check if user has admin access
  const hasAdminAccess = user && (
    user.role === 'superadmin' || 
    user.role === 'admin' ||
    user.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL
  );

  useEffect(() => {
    if (hasAdminAccess) {
      fetchDashboardData();
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    if (hasAdminAccess) {
      switch (activeTab) {
        case 'users':
          fetchUsers();
          break;
        case 'books':
          fetchBooks();
          break;
        case 'borrows':
          fetchBorrowRequests();
          break;
        case 'clubs':
          fetchBookClubs();
          break;
        case 'reports':
          fetchReports();
          break;
        case 'analytics':
          fetchAnalytics();
          break;
        default:
          break;
      }
    }
  }, [hasAdminAccess, activeTab, filters, pagination.page]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPIService.getDashboard();
      setDashboardData(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPIService.getUsers(filters);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await adminAPIService.getBooks(params);
      setBooks(response.data.data.books);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchBorrowRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await adminAPIService.getBorrowRequests(params);
      setBorrowRequests(response.data.data.borrowRequests || []);
      if (response.data.data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching borrow requests:', error);
      setBorrowRequests([]);
      setTabErrors(prev => ({ ...prev, borrows: 'Failed to load borrow requests' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchBookClubs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await adminAPIService.getBookClubs(params);
      setBookClubs(response.data.data.bookClubs || []);
      if (response.data.data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching book clubs:', error);
      setBookClubs([]);
      setTabErrors(prev => ({ ...prev, clubs: 'Failed to load book clubs' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await adminAPIService.getReports(params);
      setReports(response.data.data.reports || []);
      if (response.data.data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      setTabErrors(prev => ({ ...prev, reports: 'Failed to load reports' }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPIService.getAnalytics('30d');
      // Analytics data is already in dashboardData, so we don't need separate state
      console.log('Analytics data:', response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      let updateData = {};
      
      switch (action) {
        case 'activate':
          updateData.isActive = true;
          break;
        case 'deactivate':
          updateData.isActive = false;
          break;
        case 'makeAdmin':
          updateData.role = 'admin';
          break;
        case 'removeAdmin':
          updateData.role = 'user';
          break;
        default:
          return;
      }

      await adminAPIService.updateUser(userId, updateData);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await adminAPIService.deleteBook(bookId);
        fetchBooks(); // Refresh the list
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book');
      }
    }
  };

  const handleBorrowRequestAction = async (requestId, action) => {
    try {
      let status;
      switch (action) {
        case 'approve':
          status = 'approved';
          break;
        case 'reject':
          status = 'rejected';
          break;
        default:
          return;
      }

      await adminAPIService.updateBorrowRequest(requestId, { status });
      fetchBorrowRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating borrow request:', error);
      alert('Failed to update borrow request');
    }
  };

  const handleBookClubAction = async (clubId, action) => {
    try {
      switch (action) {
        case 'activate':
          await adminAPIService.updateBookClub(clubId, { isActive: true });
          break;
        case 'deactivate':
          await adminAPIService.updateBookClub(clubId, { isActive: false });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this book club?')) {
            await adminAPIService.deleteBookClub(clubId);
          } else {
            return;
          }
          break;
        default:
          return;
      }

      fetchBookClubs(); // Refresh the list
    } catch (error) {
      console.error('Error updating book club:', error);
      alert('Failed to update book club');
    }
  };

  // Redirect if not admin
  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  if (loading && activeTab === 'overview' && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.overview?.totalUsers?.toLocaleString() || '1,525'}
              </p>
            </div>
            <div className="text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Borrows</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.overview?.totalBorrowRequests?.toLocaleString() || '10,892'}
              </p>
            </div>
            <div className="text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Books</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.overview?.totalBooks?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Active Users</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.overview?.activeUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-red-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Book Sharing Activity</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active Borrows</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">New Books</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900">Monthly</button>
            <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900">Quarterly</button>
            <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Yearly</button>
          </div>

          {/* Chart Placeholder */}
          <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization will appear here</p>
              <p className="text-sm text-gray-400">Real data from your BookHive platform</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Borrows</p>
                <p className="text-lg font-semibold text-gray-900">{dashboardData?.overview?.activeBorrowRequests || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">New Books Added</p>
                <p className="text-lg font-semibold text-gray-900">{dashboardData?.overview?.newBooksThisMonth || '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">See All</button>
          </div>

          {/* Donut Chart Placeholder */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <div className="w-32 h-32 rounded-full border-8 border-gray-200"></div>
              <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-transparent border-t-blue-500 border-r-purple-500 border-b-green-500 border-l-orange-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Books</p>
                  <p className="text-lg font-bold text-gray-900">{dashboardData?.overview?.totalBooks || '0'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Fiction</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{Math.round((dashboardData?.overview?.totalBooks || 0) * 0.68)}</p>
                <p className="text-xs text-gray-500">68%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Non-Fiction</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{Math.round((dashboardData?.overview?.totalBooks || 0) * 0.20)}</p>
                <p className="text-xs text-gray-500">20%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Educational</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{Math.round((dashboardData?.overview?.totalBooks || 0) * 0.08)}</p>
                <p className="text-xs text-gray-500">8%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Children's</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{Math.round((dashboardData?.overview?.totalBooks || 0) * 0.04)}</p>
                <p className="text-xs text-gray-500">4%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Top Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">See All</button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">New Book Added</p>
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">New</span>
                </div>
                <p className="text-xs text-gray-500">John Doe • 12 Jan 25</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Book Overdue Alert</p>
                  <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">Alert</span>
                </div>
                <p className="text-xs text-gray-500">MacBook Air M2 • 3 Jan 25</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Book Club Event</p>
                  <span className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">Event</span>
                </div>
                <p className="text-xs text-gray-500">Applied 50 times • 8 Jan 25</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Database className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">System Update</p>
                  <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">System</span>
                </div>
                <p className="text-xs text-gray-500">Version 1.2.1 • 2 Jan 25</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Books */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Books</h3>
            <div className="flex items-center space-x-2">
              <button className="p-1 hover:bg-gray-100 rounded">
                <Filter className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Book</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Borrows</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Rating</th>
                  <th className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {dashboardData?.recentActivity?.recentBooks?.slice(0, 3).map((book, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${
                          index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-purple-100' : 'bg-green-100'
                        }`}>
                          <BookOpen className={`w-4 h-4 ${
                            index === 0 ? 'text-blue-600' : index === 1 ? 'text-purple-600' : 'text-green-600'
                          }`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{book.title}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">-</td>
                    <td className="py-3 text-sm text-gray-600">-</td>
                    <td className="py-3 text-sm text-gray-600">Available</td>
                  </tr>
                )) || [
                  <tr key="no-data" className="border-t border-gray-100">
                    <td colSpan="4" className="py-6 text-center text-gray-500">
                      No books available yet
                    </td>
                  </tr>
                ]}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' || user.role === 'superadmin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      user.isActive !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Books: {user.stats?.booksOwned || 0}</div>
                    <div>Borrows: {user.stats?.borrowRequests || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.isActive !== false ? (
                        <button
                          onClick={() => handleUserAction(user._id, 'deactivate')}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user._id, 'activate')}
                          className="text-green-600 hover:text-green-900"
                          title="Activate User"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {user.role !== 'admin' && user.role !== 'superadmin' ? (
                        <button
                          onClick={() => handleUserAction(user._id, 'makeAdmin')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Make Admin"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      ) : user.role === 'admin' && (
                        <button
                          onClick={() => handleUserAction(user._id, 'removeAdmin')}
                          className="text-gray-600 hover:text-gray-900"
                          title="Remove Admin"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBooks = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search books by title, author, or ISBN..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Books</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Books ({books.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-500">by {book.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.owner?.name}</div>
                    <div className="text-sm text-gray-500">{book.owner?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      book.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.isAvailable ? 'Available' : 'Borrowed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteBook(book._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Book"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Additional render functions for new tabs
  const renderBorrows = () => (
    <div className="space-y-6">
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading borrow requests...</p>
        </div>
      )}
      
      {tabErrors.borrows && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{tabErrors.borrows}</p>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search borrow requests..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="borrowed">Borrowed</option>
            <option value="returned">Returned</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Borrow Requests Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Borrow Requests ({borrowRequests.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {borrowRequests.filter(request => 
                filters.search === '' || 
                request.book?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                request.borrower?.name?.toLowerCase().includes(filters.search.toLowerCase())
              ).filter(request =>
                filters.status === 'all' || request.status === filters.status
              ).map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{request.book.title}</div>
                        <div className="text-sm text-gray-500">by {request.book.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.borrower.name}</div>
                    <div className="text-sm text-gray-500">{request.borrower.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.owner.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'borrowed' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'returned' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleBorrowRequestAction(request._id, 'approve')}
                          className="text-green-600 hover:text-green-900 mr-3" 
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleBorrowRequestAction(request._id, 'reject')}
                          className="text-red-600 hover:text-red-900" 
                          title="Reject"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderClubs = () => (
    <div className="space-y-6">
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading book clubs...</p>
        </div>
      )}
      
      {tabErrors.clubs && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{tabErrors.clubs}</p>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search book clubs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Clubs</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Book Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookClubs.filter(club => 
          filters.search === '' || 
          club.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          club.description?.toLowerCase().includes(filters.search.toLowerCase())
        ).filter(club =>
          filters.status === 'all' || 
          (filters.status === 'active' && club.isActive) ||
          (filters.status === 'inactive' && !club.isActive)
        ).map((club) => (
          <div key={club._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                club.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {club.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{club.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {club.members?.length || 0} members
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-900" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleBookClubAction(club._id, club.isActive ? 'deactivate' : 'activate')}
                  className={`${club.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`} 
                  title={club.isActive ? 'Deactivate' : 'Activate'}
                >
                  {club.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleBookClubAction(club._id, 'delete')}
                  className="text-red-600 hover:text-red-900" 
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Created {new Date(club.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {bookClubs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Book Clubs Found</h3>
          <p className="text-gray-600">Book clubs will appear here when users create them.</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    const [analyticsFilter, setAnalyticsFilter] = useState('7d');
    
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Analytics Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
            <div className="flex space-x-2">
              {['7d', '30d', '90d', '1y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setAnalyticsFilter(period)}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    analyticsFilter === period
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-gray-600">Detailed insights and performance metrics for your BookHive platform.</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">User Growth</h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">+{dashboardData?.overview?.userGrowthRate || 12.5}%</p>
            <p className="text-sm text-gray-500">vs previous period</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Book Additions</h4>
            <p className="text-2xl font-bold text-green-600 mt-2">+{dashboardData?.overview?.bookGrowthRate || 8.3}%</p>
            <p className="text-sm text-gray-500">vs previous period</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ArrowLeftRight className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Borrow Rate</h4>
            <p className="text-2xl font-bold text-purple-600 mt-2">+15.7%</p>
            <p className="text-sm text-gray-500">vs previous period</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Engagement</h4>
            <p className="text-2xl font-bold text-orange-600 mt-2">+22.1%</p>
            <p className="text-sm text-gray-500">vs previous period</p>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">User Engagement Metrics</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Daily Active Users</span>
                <span className="font-semibold">{dashboardData?.systemStats?.dailyActiveUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Session Duration</span>
                <span className="font-semibold">12m 34s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Return User Rate</span>
                <span className="font-semibold">68.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Book Discovery Rate</span>
                <span className="font-semibold">45.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-semibold">{dashboardData?.overview?.totalBorrowRequests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold">94.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Response Time</span>
                <span className="font-semibold">1.2s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">System Uptime</span>
                <span className="font-semibold">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => (
    <div className="space-y-6">
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      )}
      
      {tabErrors.reports && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{tabErrors.reports}</p>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.filter(report => 
          filters.search === '' || 
          report.reason?.toLowerCase().includes(filters.search.toLowerCase()) ||
          report.description?.toLowerCase().includes(filters.search.toLowerCase())
        ).filter(report =>
          filters.status === 'all' || report.status === filters.status
        ).map((report) => (
          <div key={report._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    report.status === 'pending' ? 'bg-yellow-400' :
                    report.status === 'resolved' ? 'bg-green-400' :
                    'bg-gray-400'
                  }`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.reason}</h3>
                  <span className={`ml-3 inline-flex px-2 py-1 text-xs rounded-full ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{report.description}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>Reported by: {report.reportedBy.name}</span>
                  {report.reportedUser && <span>Against: {report.reportedUser.name}</span>}
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  Resolve
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Dismiss
                </button>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600">User reports will appear here when submitted.</p>
        </div>
      )}
    </div>
  );

  const renderSettings = () => {
    const [settings, setSettings] = useState({
      emailNotifications: true,
      userRegistration: true,
      bookApproval: false,
      maintenanceMode: false,
      publicRegistration: true,
      autoApproveBooks: true
    });

    const handleSettingChange = (setting, value) => {
      setSettings(prev => ({ ...prev, [setting]: value }));
    };

    return (
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Send email notifications for important events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">User Registration</h4>
                <p className="text-sm text-gray-600">Allow new users to register on the platform</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.userRegistration}
                  onChange={(e) => handleSettingChange('userRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Book Approval Required</h4>
                <p className="text-sm text-gray-600">Require admin approval for new book listings</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bookApproval}
                  onChange={(e) => handleSettingChange('bookApproval', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Platform Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium">99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Backup:</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Database Size:</span>
                  <span className="font-medium">2.4 GB</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                  Export User Data
                </button>
                <button className="w-full px-4 py-2 text-left text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                  Backup Database
                </button>
                <button className="w-full px-4 py-2 text-left text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">
                  Clear Cache
                </button>
                <button className="w-full px-4 py-2 text-left text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                  System Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Save Changes</h4>
              <p className="text-sm text-gray-600">Apply your configuration changes</p>
            </div>
            <button 
              onClick={() => alert('Settings saved successfully!')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHelp = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Help Center</h3>
      <p className="text-gray-600">Documentation and support resources.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Admin Guide</h4>
          <p className="text-sm text-gray-600">Complete guide for platform administration</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">API Documentation</h4>
          <p className="text-sm text-gray-600">Technical documentation for developers</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">Support Tickets</h4>
          <p className="text-sm text-gray-600">Submit and track support requests</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-2">System Status</h4>
          <p className="text-sm text-gray-600">Check platform health and uptime</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BookHive</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MAIN</div>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'books'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-3" />
              Books
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Users
            </button>

            <button
              onClick={() => setActiveTab('borrows')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'borrows'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 mr-3" />
              Borrow Requests
            </button>

            <button
              onClick={() => setActiveTab('clubs')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'clubs'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Book Clubs
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 mr-3" />
              Reports
            </button>

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">SETTINGS</div>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'help'
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              Help Center
            </button>
          </div>
        </div>

        {/* Admin Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 mr-2" />
              <span className="font-semibold">Admin Access</span>
            </div>
            <p className="text-sm text-blue-100 mb-2">
              Logged in as: {user?.name}
            </p>
            <p className="text-xs text-blue-200">
              Super Administrator
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          {/* Tab Header with Refresh Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h2>
            <button
              onClick={() => {
                switch (activeTab) {
                  case 'overview':
                    fetchDashboardData();
                    break;
                  case 'users':
                    fetchUsers();
                    break;
                  case 'books':
                    fetchBooks();
                    break;
                  case 'borrows':
                    fetchBorrowRequests();
                    break;
                  case 'clubs':
                    fetchBookClubs();
                    break;
                  case 'reports':
                    fetchReports();
                    break;
                  case 'analytics':
                    fetchAnalytics();
                    break;
                  default:
                    break;
                }
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'books' && renderBooks()}
          {activeTab === 'borrows' && renderBorrows()}
          {activeTab === 'clubs' && renderClubs()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'help' && renderHelp()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;