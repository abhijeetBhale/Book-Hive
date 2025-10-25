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
  LineChart,
  ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { adminAPIService } from '../utils/adminAPI';
import { Navigate } from 'react-router-dom';
import ReportActionModal from '../components/admin/ReportActionModal';
import ActionSuccessModal from '../components/admin/ActionSuccessModal';
import ReportDetailsModal from '../components/admin/ReportDetailsModal';

// Import new admin components
import BookSharingActivity from '../components/admin/BookSharingActivity';
import TopCategories from '../components/admin/TopCategories';
import RecentActivity from '../components/admin/RecentActivity';
import TopBooks from '../components/admin/TopBooks';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [booksForSale, setBooksForSale] = useState([]);
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

  // Books-specific state
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Analytics-specific state
  const [analyticsFilter, setAnalyticsFilter] = useState('7d');

  // Settings-specific state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    userRegistration: true,
    bookApproval: false,
    maintenanceMode: false,
    publicRegistration: true,
    autoApproveBooks: true
  });

  // Modal states for report actions
  const [reportActionModal, setReportActionModal] = useState({
    isOpen: false,
    action: null,
    report: null
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    action: null,
    report: null,
    actionData: null
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    report: null
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
        case 'books-for-sale':
          fetchBooksForSale();
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

  // Reset to first page when books filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, booksPerPage]);

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

  const fetchBooks = async (customParams = {}) => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...customParams
      };

      // If limit is 'all', fetch all books
      if (params.limit === 'all') {
        params.all = true;
        delete params.page;
        delete params.limit;
      }

      const response = await adminAPIService.getBooks(params);
      setBooks(response.data.data.books);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    }
  };

  const fetchBooksForSale = async (customParams = {}) => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...customParams
      };

      // If limit is 'all', fetch all books
      if (params.limit === 'all') {
        params.all = true;
        delete params.page;
        delete params.limit;
      }

      const response = await adminAPIService.getBooksForSale(params);
      setBooksForSale(response.data.data.books);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching books for sale:', error);
      setBooksForSale([]);
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

  // Report action handlers
  // Report action handlers
  const handleReportAction = (reportId, action, report) => {
    setReportActionModal({
      isOpen: true,
      action: action,
      report: { ...report, _id: reportId }
    });
  };

  const handleConfirmReportAction = async (actionData) => {
    const { action, report } = reportActionModal;

    try {
      await adminAPIService.takeReportAction(report._id, action, actionData);

      // Close action modal and show success modal
      setReportActionModal({ isOpen: false, action: null, report: null });
      setSuccessModal({
        isOpen: true,
        action: action,
        report: report,
        actionData: actionData
      });

      // Refresh the reports list
      fetchReports();
    } catch (error) {
      console.error('Error taking report action:', error);
      // You could add an error modal here too
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  const handleViewReportDetails = (report) => {
    setDetailsModal({
      isOpen: true,
      report: report
    });
  };

  const closeReportActionModal = () => {
    setReportActionModal({ isOpen: false, action: null, report: null });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, action: null, report: null, actionData: null });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, report: null });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Books for Sale</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.overview?.totalBooksForSale?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-orange-500">
              <DollarSign className="w-5 h-5" />
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
        {/* Book Sharing Activity - Real-time Component */}
        <div className="lg:col-span-2">
          <BookSharingActivity />
        </div>

        {/* Top Categories - Real-time Component */}
        <div>
          <TopCategories />
        </div>
      </div>

      {/* Recent Activity and Top Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - Real-time Component */}
        <RecentActivity />

        {/* Top Books - Real-time Component */}
        <TopBooks />
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
                        <div className="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user.role === 'admin' || user.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user.isActive !== false
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

  const renderBooks = () => {

    // Filter books based on search and status
    const filteredBooks = books.filter(book => {
      const matchesSearch = !filters.search ||
        book.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.author?.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.category?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'available' && book.isAvailable) ||
        (filters.status === 'borrowed' && !book.isAvailable);

      return matchesSearch && matchesStatus;
    });

    // Sort books
    const sortedBooks = [...filteredBooks].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'owner') {
        aValue = a.owner?.name || '';
        bValue = b.owner?.name || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginate books
    const totalBooks = sortedBooks.length;
    const totalPages = booksPerPage === 'all' ? 1 : Math.ceil(totalBooks / booksPerPage);
    const startIndex = booksPerPage === 'all' ? 0 : (currentPage - 1) * booksPerPage;
    const endIndex = booksPerPage === 'all' ? totalBooks : startIndex + booksPerPage;
    const paginatedBooks = sortedBooks.slice(startIndex, endIndex);



    return (
      <div className="space-y-6">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books by title, author, ISBN, or category..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="borrowed">Borrowed</option>
              </select>
            </div>

            {/* Items per page */}
            <div>
              <select
                value={booksPerPage}
                onChange={(e) => setBooksPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
                <option value={30}>Show 30</option>
                <option value={50}>Show 50</option>
                <option value="all">Show All</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Date Added</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="category">Category</option>
                <option value="owner">Owner</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalBooks)} of {totalBooks} books
            </div>
          </div>
        </div>

        {/* Books Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Books ({totalBooks} total)
              </h3>
              <div className="flex items-center space-x-2">
                <RefreshCw
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={fetchBooks}
                />
                <span className="text-sm text-gray-500">
                  {booksPerPage === 'all' ? 'All books' : `Page ${currentPage} of ${totalPages}`}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
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
                {paginatedBooks.length > 0 ? paginatedBooks.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center flex-shrink-0">
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{book.title || 'Untitled Book'}</div>
                          <div className="text-sm text-gray-500 truncate">by {book.author || 'Unknown Author'}</div>
                          {book.isbn && (
                            <div className="text-xs text-gray-400">ISBN: {book.isbn}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {book.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{book.owner?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 truncate">{book.owner?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${book.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {book.isAvailable ? 'Available' : 'Borrowed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {book.viewCount || 0} views
                        </div>
                        <div className="flex items-center">
                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                          {book.borrowCount || 0} borrows
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Delete Book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Books Found</h3>
                      <p className="text-gray-600">
                        {filters.search || filters.status !== 'all'
                          ? 'Try adjusting your search or filters.'
                          : 'Books will appear here when users add them to the platform.'
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {booksPerPage !== 'all' && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalBooks)} of {totalBooks} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-1 text-sm rounded ${currentPage === totalPages
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Books</p>
                <p className="text-lg font-semibold text-gray-900">{books.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-lg font-semibold text-gray-900">
                  {books.filter(book => book.isAvailable).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Borrowed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {books.filter(book => !book.isAvailable).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Unique Owners</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Set(books.map(book => book.owner?._id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBooksForSale = () => {
    // Filter books for sale based on search
    const filteredBooks = booksForSale.filter(book => {
      const matchesSearch = !filters.search ||
        book.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.author?.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.category?.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSearch;
    });

    // Sort books
    const sortedBooks = [...filteredBooks].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'owner') {
        aValue = a.owner?.name || '';
        bValue = b.owner?.name || '';
      } else if (sortBy === 'sellingPrice') {
        aValue = a.sellingPrice || 0;
        bValue = b.sellingPrice || 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginate books
    const totalBooks = sortedBooks.length;
    const totalPages = booksPerPage === 'all' ? 1 : Math.ceil(totalBooks / booksPerPage);
    const startIndex = booksPerPage === 'all' ? 0 : (currentPage - 1) * booksPerPage;
    const endIndex = booksPerPage === 'all' ? totalBooks : startIndex + booksPerPage;
    const paginatedBooks = sortedBooks.slice(startIndex, endIndex);

    return (
      <div className="space-y-6">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books for sale by title, author, or category..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <select
                value={filters.priceRange || 'all'}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="under10">Under ₹10</option>
                <option value="10to25">₹10 - ₹25</option>
                <option value="25to50">₹25 - ₹50</option>
                <option value="over50">Over ₹50</option>
              </select>
            </div>

            {/* Items per page */}
            <div>
              <select
                value={booksPerPage}
                onChange={(e) => setBooksPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
                <option value={30}>Show 30</option>
                <option value={50}>Show 50</option>
                <option value="all">Show All</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Date Added</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="sellingPrice">Price</option>
                <option value="category">Category</option>
                <option value="owner">Owner</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalBooks)} of {totalBooks} books
            </div>
          </div>
        </div>

        {/* Books for Sale Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Books for Sale ({totalBooks} total)
              </h3>
              <div className="flex items-center space-x-2">
                <RefreshCw
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={fetchBooksForSale}
                />
                <span className="text-sm text-gray-500">
                  {booksPerPage === 'all' ? 'All books' : `Page ${currentPage} of ${totalPages}`}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
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
                {paginatedBooks.length > 0 ? paginatedBooks.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{book.title || 'Untitled Book'}</div>
                          <div className="text-sm text-gray-500 truncate">by {book.author || 'Unknown Author'}</div>
                          {book.isbn && (
                            <div className="text-xs text-gray-400">ISBN: {book.isbn}</div>
                          )}
                          {book.condition && (
                            <div className="text-xs text-gray-500">Condition: {book.condition}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {book.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₹{book.sellingPrice?.toFixed(2) || '0.00'}</div>
                      {book.marketPrice && (
                        <div className="text-xs text-gray-500">Market: ₹{book.marketPrice.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {book.priceStatus === 'reasonable' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ✓ Reasonable
                        </span>
                      ) : book.priceStatus === 'high' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          ⚠ Above Market
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          ? Not Validated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{book.owner?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 truncate">{book.owner?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Delete Book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Books for Sale Found</h3>
                      <p className="text-gray-600">
                        {filters.search || filters.priceRange !== 'all'
                          ? 'Try adjusting your search or filters.'
                          : 'Books for sale will appear here when users list them.'
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - same as books */}
          {booksPerPage !== 'all' && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalBooks)} of {totalBooks} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-1 text-sm rounded ${currentPage === totalPages
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats for Books for Sale */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total for Sale</p>
                <p className="text-lg font-semibold text-gray-900">{booksForSale.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{booksForSale.length > 0 
                    ? (booksForSale.reduce((sum, book) => sum + (book.sellingPrice || 0), 0) / booksForSale.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Price Validated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {booksForSale.filter(book => book.priceStatus === 'reasonable').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Unique Sellers</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Set(booksForSale.map(book => book.owner?._id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              ).length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Borrow Requests Found</h3>
                    <p className="text-gray-600">
                      {filters.search || filters.status !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : 'Borrow requests will appear here when users request books.'
                      }
                    </p>
                  </td>
                </tr>
              ) : borrowRequests.filter(request =>
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
                        <div className="text-sm font-medium text-gray-900">
                          {request.book?.title || 'Book Deleted'}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {request.book?.author || 'Unknown Author'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.borrower?.name || 'Unknown User'}</div>
                    <div className="text-sm text-gray-500">{request.borrower?.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.owner?.name || 'Unknown Owner'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
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
              <h3 className="text-lg font-semibold text-gray-900">{club.name || 'Unnamed Club'}</h3>
              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${club.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {club.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{club.description || 'No description available'}</p>
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
                  className={`px-3 py-1 text-sm rounded-lg ${analyticsFilter === period
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

        {/* Additional Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Activity Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">User Activity Trend</h4>
            <div className="h-48 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-center p-4">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Activity visualization</p>
                <p className="text-xs text-gray-400">Based on {analyticsFilter} data</p>
              </div>
            </div>
          </div>

          {/* Book Categories Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h4>
            <div className="h-48 bg-gradient-to-t from-purple-50 to-transparent rounded-lg flex items-end justify-center p-4">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Category breakdown</p>
                <p className="text-xs text-gray-400">Top categories by book count</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">System Health</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="text-sm font-medium">35%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Memory</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <span className="text-sm font-medium">68%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <span className="text-sm font-medium">42%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Network</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Analytics Export</h4>
              <p className="text-sm text-gray-600">Download detailed analytics reports for the selected period</p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Export CSV
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Export PDF
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Generate Report
              </button>
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
                  <div className={`w-3 h-3 rounded-full mr-3 ${report.status === 'pending' ? 'bg-yellow-400' :
                    report.status === 'resolved' ? 'bg-green-400' :
                      'bg-gray-400'
                    }`}></div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.reason || 'No reason provided'}</h3>
                  <span className={`ml-3 inline-flex px-2 py-1 text-xs rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{report.description || 'No description provided'}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>Reported by: {report.reportedBy?.name || 'Unknown User'}</span>
                  {report.reportedUser && <span>Against: {report.reportedUser?.name || 'Unknown User'}</span>}
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-4">
                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReportAction(report._id, 'warn', report)}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Warn User
                    </button>
                    <button
                      onClick={() => handleReportAction(report._id, 'ban', report)}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Ban className="w-3 h-3 inline mr-1" />
                      Ban User
                    </button>
                    <button
                      onClick={() => handleReportAction(report._id, 'delete', report)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Delete Account
                    </button>
                    <button
                      onClick={() => handleReportAction(report._id, 'dismiss', report)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Dismiss
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleViewReportDetails(report)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-3 h-3 inline mr-1" />
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

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const renderSettings = () => {

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

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth || false}
                  onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Session Timeout</h4>
                <p className="text-sm text-gray-600">Automatic logout after inactivity</p>
              </div>
              <select
                value={settings.sessionTimeout || '30'}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Password Policy</h4>
                <p className="text-sm text-gray-600">Enforce strong password requirements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.strongPasswords || true}
                  onChange={(e) => handleSettingChange('strongPasswords', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Content Moderation */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Content Moderation</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-moderate Content</h4>
                <p className="text-sm text-gray-600">Automatically flag inappropriate content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoModeration || false}
                  onChange={(e) => handleSettingChange('autoModeration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Review Queue</h4>
                <p className="text-sm text-gray-600">Manual review for flagged content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reviewQueue || true}
                  onChange={(e) => handleSettingChange('reviewQueue', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Backup & Recovery */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Backup & Recovery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Automatic Backups</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frequency:</span>
                  <select
                    value={settings.backupFrequency || 'daily'}
                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Retention:</span>
                  <select
                    value={settings.backupRetention || '30'}
                    onChange={(e) => handleSettingChange('backupRetention', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Manual Actions</h4>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-left text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Create Backup Now
                </button>
                <button className="w-full px-3 py-2 text-left text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  Download Latest Backup
                </button>
                <button className="w-full px-3 py-2 text-left text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                  Restore from Backup
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
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // Reset to default values
                  setSettings({
                    emailNotifications: true,
                    userRegistration: true,
                    bookApproval: false,
                    maintenanceMode: false,
                    publicRegistration: true,
                    autoApproveBooks: true
                  });
                  alert('Settings reset to defaults!');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => alert('Settings saved successfully!')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHelp = () => (
    <div className="space-y-6">
      {/* Help Center Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Help Center</h3>
            <p className="text-sm text-gray-500">Documentation, guides, and support resources</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Admin Guide</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Complete guide for platform administration and management</p>
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <span>Read Guide</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">API Documentation</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Technical documentation for developers and integrations</p>
          <div className="flex items-center text-purple-600 text-sm font-medium">
            <span>View Docs</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Support Tickets</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Submit and track support requests and issues</p>
          <div className="flex items-center text-green-600 text-sm font-medium">
            <span>Create Ticket</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900">System Status</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Check platform health, uptime, and performance</p>
          <div className="flex items-center text-orange-600 text-sm font-medium">
            <span>View Status</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Troubleshooting</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Common issues and solutions for platform problems</p>
          <div className="flex items-center text-red-600 text-sm font-medium">
            <span>Get Help</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Configuration</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">Platform setup and configuration guidelines</p>
          <div className="flex items-center text-indigo-600 text-sm font-medium">
            <span>Learn More</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Frequently Asked Questions</h4>
        <div className="space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <h5 className="font-medium text-gray-900 mb-2">How do I manage user permissions?</h5>
            <p className="text-sm text-gray-600">You can manage user permissions through the Users tab. Click on any user to view their profile and modify their role or status.</p>
          </div>
          <div className="border-b border-gray-100 pb-4">
            <h5 className="font-medium text-gray-900 mb-2">How do I approve or reject borrow requests?</h5>
            <p className="text-sm text-gray-600">Navigate to the Borrow Requests tab where you can see all pending requests. Use the approve or reject buttons to manage each request.</p>
          </div>
          <div className="border-b border-gray-100 pb-4">
            <h5 className="font-medium text-gray-900 mb-2">Can I export platform data?</h5>
            <p className="text-sm text-gray-600">Yes, you can export user data and other platform information through the Settings tab under Quick Actions.</p>
          </div>
          <div className="pb-4">
            <h5 className="font-medium text-gray-900 mb-2">How do I monitor platform performance?</h5>
            <p className="text-sm text-gray-600">Use the Analytics tab to view detailed performance metrics, user engagement, and platform statistics.</p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Need Additional Help?</h4>
            <p className="text-sm text-gray-600">Contact our support team for personalized assistance</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Contact Support
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Schedule Call
            </button>
          </div>
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
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'books'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <BookOpen className="w-4 h-4 mr-3" />
              Books
            </button>

            <button
              onClick={() => setActiveTab('books-for-sale')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'books-for-sale'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <ShoppingCart className="w-4 h-4 mr-3" />
              Books for Sale
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Users
            </button>

            <button
              onClick={() => setActiveTab('borrows')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'borrows'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <ArrowLeftRight className="w-4 h-4 mr-3" />
              Borrow Requests
            </button>

            <button
              onClick={() => setActiveTab('clubs')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'clubs'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Book Clubs
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'analytics'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'reports'
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
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'settings'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'help'
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
                  case 'books-for-sale':
                    fetchBooksForSale();
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
          {activeTab === 'books-for-sale' && renderBooksForSale()}
          {activeTab === 'borrows' && renderBorrows()}
          {activeTab === 'clubs' && renderClubs()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'help' && renderHelp()}
        </div>
      </div>

      {/* Report Action Modal */}
      <ReportActionModal
        isOpen={reportActionModal.isOpen}
        onClose={closeReportActionModal}
        action={reportActionModal.action}
        report={reportActionModal.report}
        onConfirm={handleConfirmReportAction}
      />

      {/* Success Modal */}
      <ActionSuccessModal
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        action={successModal.action}
        report={successModal.report}
        actionData={successModal.actionData}
      />

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={closeDetailsModal}
        report={detailsModal.report}
      />
    </div>
  );
};

export default AdminDashboard;