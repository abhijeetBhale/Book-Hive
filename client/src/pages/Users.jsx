// import React, { useState, useEffect, useContext } from 'react';
// import { usersAPI } from '../utils/api';
// import { AuthContext } from '../context/AuthContext';
// import { Loader, MapPin, User, Search, BookOpen, LayoutGrid, Star } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import styled from 'styled-components';
// import toast from 'react-hot-toast';

// // --- UserCard Component ---
// const UserCard = ({ user, distance, priority }) => {
//   const booksOwnedCount = (user.booksOwned || []).length;
//   const rating = user.rating?.value || (Math.random() * 1.5 + 3.5);

//   return (
//     <Link to={`/profile/${user._id}`} className="user-card-link">
//       <div className={`user-card ${priority <= 3 ? 'priority-high' : priority <= 10 ? 'priority-medium' : 'priority-low'}`}>
//         {priority <= 3 && <div className="priority-badge">Top Match</div>}
//         <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=818cf8&color=fff`} alt={user.name} className="avatar" />
//         <h3 className="user-name">{user.name}</h3>
//         <p className="user-tagline">Community Member</p>

//         <div className="stats-grid">
//           <div className="stat-item">
//             <BookOpen size={18} className="stat-icon" />
//             <span>Books</span>
//             <strong>{booksOwnedCount}</strong>
//           </div>
//           <div className="stat-item">
//             <Star size={18} className="stat-icon" />
//             <span>Rating</span>
//             <strong>{typeof rating === 'number' ? rating.toFixed(1) : rating}</strong>
//           </div>
//           <div className="stat-item">
//             <MapPin size={18} className="stat-icon" />
//             <span>Distance</span>
//             <strong>{distance !== null ? `${distance} km` : 'N/A'}</strong>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// };

// const Users = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterBy, setFilterBy] = useState('all');
//   const { user: userFromAuth } = useContext(AuthContext);

//   useEffect(() => {
//     const fetchUsers = async () => {
//       setLoading(true);
//       try {
//         const { data } = await usersAPI.getUsersWithBooks();
//         setUsers(data.users || []);
//       } catch (error) {
//         console.error('Failed to fetch users:', error);
//         toast.error("Could not refresh community data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (userFromAuth) {
//       fetchUsers();
//     }
//   }, [userFromAuth]);

//   const currentUser = users.find(u => u._id === userFromAuth?._id) || userFromAuth;

//   const getDistance = (userCoords, currentCoords) => {
//     if (!userCoords || !currentCoords) return null;
//     const R = 6371; // Earth's radius in km
//     const lat1 = currentCoords[1] * Math.PI / 180;
//     const lat2 = userCoords[1] * Math.PI / 180;
//     const deltaLat = (userCoords[1] - currentCoords[1]) * Math.PI / 180;
//     const deltaLon = (userCoords[0] - currentCoords[0]) * Math.PI / 180;
//     const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c;

//     // THE FIX IS HERE: This final check prevents NaN values from being returned.
//     // If the calculation results in NaN, we return null instead.
//     return isNaN(distance) ? null : Math.round(distance);
//   };

//   const filteredUsers = users.filter(user => {
//     if (user._id === currentUser?._id) return false;
//     const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
//     if (!matchesSearch) return false;
//     switch (filterBy) {
//       case 'withBooks':
//         return user.booksOwned && user.booksOwned.length > 0;
//       case 'nearby':
//         return user.location?.coordinates && currentUser?.location?.coordinates;
//       default:
//         return true;
//     }
//   }).map(user => {
//     // Calculate distance for each user for sorting purposes
//     const distance = getDistance(user.location?.coordinates, currentUser?.location?.coordinates);
//     const rating = user.rating?.value || (Math.random() * 1.5 + 3.5);
//     const booksCount = (user.booksOwned || []).length;

//     return { 
//       ...user, 
//       distance, 
//       rating: typeof rating === 'number' ? rating : parseFloat(rating),
//       booksCount 
//     };
//   }).sort((a, b) => {
//     // Priority-based sorting system

//     // 1. FIRST PRIORITY: Distance (closest first)
//     // Handle null distances - users without location go to the end
//     if (a.distance === null && b.distance === null) {
//       // If both have no distance, continue to next priority
//     } else if (a.distance === null) {
//       return 1; // a goes after b
//     } else if (b.distance === null) {
//       return -1; // a goes before b
//     } else {
//       // Both have distances - compare them
//       const distanceDiff = a.distance - b.distance;
//       if (Math.abs(distanceDiff) > 5) { // Only prioritize if distance difference > 5km
//         return distanceDiff;
//       }
//       // If distances are similar (within 5km), continue to next priority
//     }

//     // 2. SECOND PRIORITY: Rating (highest first)
//     const ratingDiff = b.rating - a.rating;
//     if (Math.abs(ratingDiff) > 0.5) { // Only prioritize if rating difference > 0.5
//       return ratingDiff;
//     }

//     // 3. THIRD PRIORITY: Number of books (most books first)
//     const booksDiff = b.booksCount - a.booksCount;
//     if (booksDiff !== 0) {
//       return booksDiff;
//     }

//     // 4. FINAL FALLBACK: Alphabetical by name
//     return a.name.localeCompare(b.name);
//   }).map((user, index) => ({
//     ...user,
//     priority: index + 1 // Add priority ranking
//   }));

//   const EmptyState = () => (
//     <div className="empty-state">
//       <div className="empty-icon-wrapper"><User size={48} /></div>
//       <h3 className="empty-title">No Users Found</h3>
//       <p className="empty-message">{searchTerm ? `No users match "${searchTerm}"` : 'No users match your current filters. Try a different selection.'}</p>
//     </div>
//   );

//   return (
//     <StyledWrapper>
//       <div className="page-header">
//         <div>
//           <h1 className="main-title">BookHive Community</h1>
//           <p className="subtitle">Discover and connect with book lovers near you.</p>
//         </div>
//       </div>

//       <div className="filter-bar">
//         <div className="search-wrapper">
//           <Search className="search-icon" size={20} />
//           <input
//             type="text"
//             placeholder="Search by name..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//         <div className="filter-wrapper">
//           <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
//             <option value="all">All Users</option>
//             <option value="withBooks">With Books</option>
//             <option value="nearby">Nearby</option>
//           </select>
//         </div>
//         <button className="view-toggle-btn">
//           <LayoutGrid size={20} />
//         </button>
//       </div>

//       <div className="content-area">
//         {loading ? (
//           <div className="loading-state"><Loader className="animate-spin" /></div>
//         ) : filteredUsers.length > 0 ? (
//           <div className="users-grid">
//             {filteredUsers.map((user) => {
//               return <UserCard key={user._id} user={user} distance={user.distance} />
//             })}
//           </div>
//         ) : (
//           <EmptyState />
//         )}
//       </div>
//     </StyledWrapper>
//   );
// };

// const StyledWrapper = styled.div`
//   min-height: 100vh;
//   padding: 2rem 3rem;
//   max-width: 1400px;
//   margin: 0 auto;
//   font-family: 'Inter', sans-serif;

//   .page-header {
//     margin-bottom: 2rem;
//     text-align: center;
//   }
//   .main-title { font-size: 2.5rem; font-weight: 800; color: #111827; }
//   .subtitle { font-size: 1.125rem; color: #4b5563; margin-top: 0.5rem; }

//   .filter-bar {
//       display: flex;
//       gap: 1rem;
//       align-items: center;
//       margin-bottom: 2.5rem;
//       background-color: #ffffff;
//       padding: 0.75rem;
//       border-radius: 1rem;
//       box-shadow: 0 4px 15px -1px rgba(0,0,0,0.05);
//   }
//   .search-wrapper { position: relative; flex-grow: 1; }
//   .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; }
//   .filter-bar input, .filter-bar select {
//       width: 100%;
//       padding: 0.75rem 1rem 0.75rem 3rem;
//       border: none;
//       border-radius: 0.75rem;
//       background-color: #f8f9fe;
//       font-size: 1rem;
//       font-weight: 500;
//       &:focus {
//           outline: none;
//           box-shadow: 0 0 0 2px #c7d2fe;
//       }
//   }
//   .filter-bar select {
//       padding-left: 1rem;
//       background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
//       background-position: right 0.5rem center;
//       background-repeat: no-repeat;
//       background-size: 1.5em 1.5em;
//       -webkit-appearance: none;
//       -moz-appearance: none;
//       appearance: none;
//   }
//   .view-toggle-btn {
//       padding: 0.75rem;
//       border-radius: 0.75rem;
//       border: 1px solid #e5e7eb;
//       background-color: #f9fafb;
//       color: #4b5563;
//       cursor: pointer;
//       display: flex;
//   }

//   .content-area { min-height: 500px; }
//   .loading-state {
//     display: flex; justify-content: center; align-items: center; height: 500px;
//     .animate-spin { width: 3rem; height: 3rem; color: #4F46E5; }
//   }

//   .users-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//       gap: 1.5rem;
//   }

//   .user-card-link {
//       text-decoration: none;
//       color: inherit;
//   }

//   .user-card {
//       background-color: white;
//       border-radius: 1.5rem;
//       padding: 1.5rem;
//       text-align: center;
//       border: 1px solid #e5e7eb;
//       transition: all 0.3s ease;
//       display: flex;
//       flex-direction: column;
//       &:hover {
//           transform: translateY(-5px);
//           box-shadow: 0 10px 20px -5px rgba(101, 119, 134, 0.1);
//           border-color: #c7d2fe;
//       }
//   }
//   .avatar {
//       width: 80px; height: 80px;
//       border-radius: 50%;
//       object-fit: cover;
//       margin: 0 auto 1rem;
//       border: 4px solid #fff;
//       box-shadow: 0 5px 10px rgba(0,0,0,0.1);
//   }
//   .user-name { font-size: 1.25rem; font-weight: 700; color: #1f2937; }
//   .user-tagline { font-size: 0.9rem; color: #6b7280; margin-bottom: 1.5rem; flex-grow: 1;}

//   .stats-grid {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: 1rem;
//       width: 100%;
//       margin-top: auto;
//   }
//   .stat-item {
//       background-color: #f8f9fe;
//       padding: 0.75rem;
//       border-radius: 0.75rem;
//       text-align: center;
//       .stat-icon {
//           color: #4f46e5;
//           margin: 0 auto 0.5rem;
//       }
//       span {
//           display: block;
//           font-size: 0.8rem;
//           color: #9ca3af;
//           text-transform: uppercase;
//           margin-bottom: 0.25rem;
//       }
//       strong {
//           font-size: 1.1rem;
//           font-weight: 600;
//           color: #374151;
//       }
//   }

//   .empty-state {
//     display: flex; flex-direction: column; align-items: center; justify-content: center;
//     text-align: center; padding: 4rem 2rem; background-color: white;
//     border-radius: 1rem; border: 1px dashed #d1d5db;
//   }
//   .empty-icon-wrapper {
//     width: 5rem; height: 5rem; border-radius: 50%;
//     background-color: #eef2ff; color: #4F46E5;
//     display: flex; align-items: center; justify-content: center;
//     margin-bottom: 1.5rem;
//   }
//   .empty-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
//   .empty-message {
//     font-size: 1rem; color: #6b7280; max-width: 500px;
//     margin-top: 0.5rem;
//   }
// `;

// export default Users;

import React, { useState, useEffect, useContext } from 'react';
import { usersAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { Loader, MapPin, User, Search, BookOpen, LayoutGrid, Star, Award, Library, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import VerifiedBadge from '../components/ui/VerifiedBadge';

// --- UserCard Component ---
const UserCard = ({ user, distance, priority, isOnline }) => {
  const booksOwnedCount = (user.booksOwned || []).length;
  // Use the new rating structure, fallback to old structure, then to default
  const rating = user.rating?.overallRating || user.rating?.value || 0;

  // Show "New" for users with no ratings instead of 0.0
  const displayRating = rating > 0 ? rating.toFixed(1) : 'New';

  // Smart distance formatter to keep text consistent
  const formatDistance = (distInMeters) => {
    if (distInMeters === null) return 'N/A';

    // Show meters for distances less than 1000m
    if (distInMeters < 1000) {
      return `${distInMeters}m`;
    }

    // Convert to km for distances 1000m and above
    const distInKm = distInMeters / 1000;

    // Show as "1.2k km" for very large distances (1000km+)
    if (distInKm >= 1000) {
      return `${(distInKm / 1000).toFixed(1)}k km`;
    }

    // Show as "1.2 km" for normal distances (1-999 km)
    return `${distInKm.toFixed(1)} km`;
  };

  return (
    <Link to={`/users/${user._id}`} className="user-card-link">
      <div className={`user-card ${priority <= 3 ? 'priority-high' : priority <= 10 ? 'priority-medium' : 'priority-low'}`}>
        {priority <= 3 && (
          <div className="priority-badge">
            <Award color='black' size={20} />
          </div>
        )}
        <div className={`avatar-container ${isOnline ? 'online' : 'offline'}`}>
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=818cf8&color=fff`} alt={user.name} className="avatar" />
        </div>
        <h3 className="user-name">
          {user.name}
          {user.isVerified && <VerifiedBadge size={16} />}
          {isOnline && <span className="online-badge">Online</span>}
        </h3>
        <p className="user-tagline">
          Community Member
          {user.isOrganizer && (
            <span style={{ color: '#8b5cf6', fontWeight: '600', marginLeft: '4px' }}> • Organizer</span>
          )}
        </p>

        <div className="stats-grid">
          <div className="stat-item">
            <BookOpen size={18} className="stat-icon" />
            <span>Books</span>
            <strong>{booksOwnedCount}</strong>
          </div>
          <div className="stat-item">
            <Star size={18} className="stat-icon" />
            <span>Rating</span>
            <strong>{displayRating}</strong>
          </div>
          <div className="stat-item">
            <MapPin size={18} className="stat-icon" />
            <span>Distance</span>
            <strong className="distance-text">{formatDistance(distance)}</strong>
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- UserListItem Component for List View ---
const UserListItem = ({ user, distance, priority, isOnline }) => {
  const booksOwnedCount = (user.booksOwned || []).length;
  const rating = user.rating?.overallRating || user.rating?.value || 0;
  const displayRating = rating > 0 ? rating.toFixed(1) : 'New';

  const formatDistance = (distInMeters) => {
    if (distInMeters === null) return 'N/A';
    if (distInMeters < 1000) {
      return `${distInMeters}m`;
    }
    const distInKm = distInMeters / 1000;
    if (distInKm >= 1000) {
      return `${(distInKm / 1000).toFixed(1)}k km`;
    }
    return `${distInKm.toFixed(1)} km`;
  };

  return (
    <Link to={`/users/${user._id}`} className="user-list-item-link">
      <div className={`user-list-item ${priority <= 3 ? 'priority-high' : priority <= 10 ? 'priority-medium' : 'priority-low'}`}>
        {priority <= 3 && (
          <div className="priority-badge-list">
            <Award color='black' size={16} />
          </div>
        )}

        <div className={`avatar-container-list ${isOnline ? 'online' : 'offline'}`}>
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=818cf8&color=fff`} alt={user.name} className="avatar-list" />
        </div>

        <div className="user-info-list">
          <div className="user-main-info">
            <h3 className="user-name-list">
              {user.name}
              {user.isVerified && <VerifiedBadge size={16} />}
              {isOnline && <span className="online-badge-list">Online</span>}
            </h3>
            <p className="user-tagline-list">
              Community Member
              {user.isOrganizer && (
                <span style={{ color: '#8b5cf6', fontWeight: '600', marginLeft: '4px' }}> • Organizer</span>
              )}
            </p>
          </div>

          <div className="user-stats-list">
            <div className="stat-item-list">
              <BookOpen size={16} className="stat-icon-list" />
              <span className="stat-label-list">Books:</span>
              <strong className="stat-value-list">{booksOwnedCount}</strong>
            </div>
            <div className="stat-item-list">
              <Star size={16} className="stat-icon-list" />
              <span className="stat-label-list">Rating:</span>
              <strong className="stat-value-list">{displayRating}</strong>
            </div>
            <div className="stat-item-list">
              <MapPin size={16} className="stat-icon-list" />
              <span className="stat-label-list">Distance:</span>
              <strong className="stat-value-list">{formatDistance(distance)}</strong>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { user: userFromAuth } = useContext(AuthContext);
  const { isUserOnline } = useOnlineStatus();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await usersAPI.getUsersWithBooks();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error("Could not refresh community data.");
      } finally {
        setLoading(false);
      }
    };

    if (userFromAuth) {
      fetchUsers();
    }
  }, [userFromAuth]);

  const currentUser = users.find(u => u._id === userFromAuth?._id) || userFromAuth;

  const getDistance = (userCoords, currentCoords) => {
    if (!userCoords || !currentCoords) return null;
    const R = 6371; // Earth's radius in km
    const lat1 = currentCoords[1] * Math.PI / 180;
    const lat2 = userCoords[1] * Math.PI / 180;
    const deltaLat = (userCoords[1] - currentCoords[1]) * Math.PI / 180;
    const deltaLon = (userCoords[0] - currentCoords[0]) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKm = R * c;

    if (isNaN(distanceInKm)) return null;

    // Return distance in meters for better precision
    const distanceInMeters = Math.round(distanceInKm * 1000);
    return distanceInMeters;
  };

  const filteredUsers = users.filter(user => {
    if (user._id === currentUser?._id) return false;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    switch (filterBy) {
      case 'withBooks':
        return user.booksOwned && user.booksOwned.length > 0;
      case 'nearby':
        return user.location?.coordinates && currentUser?.location?.coordinates;
      default:
        return true;
    }
  }).map(user => {
    // Calculate distance for each user for sorting purposes
    const distance = getDistance(user.location?.coordinates, currentUser?.location?.coordinates);
    // Use the new rating structure, fallback to old structure, then to 0
    const rating = user.rating?.overallRating || user.rating?.value || 0;
    const booksCount = (user.booksOwned || []).length;
    return {
      ...user,
      distance,
      rating,
      booksCount
    };
  }).sort((a, b) => {
    // Priority-based sorting system

    // 1. FIRST PRIORITY: Distance (closest first)
    if (a.distance === null && b.distance === null) {
      // If both have no distance, continue to next priority
    } else if (a.distance === null) {
      return 1;
    } else if (b.distance === null) {
      return -1;
    } else {
      const distanceDiff = a.distance - b.distance;
      if (Math.abs(distanceDiff) > 5000) { // 5000 meters = 5km
        return distanceDiff;
      }
    }

    // 2. SECOND PRIORITY: Rating (highest first)
    const ratingDiff = b.rating - a.rating;
    if (Math.abs(ratingDiff) > 0.5) {
      return ratingDiff;
    }

    // 3. THIRD PRIORITY: Number of books (most books first)
    const booksDiff = b.booksCount - a.booksCount;
    if (booksDiff !== 0) {
      return booksDiff;
    }

    // 4. FINAL FALLBACK: Alphabetical by name
    return a.name.localeCompare(b.name);
  }).map((user, index) => ({
    ...user,
    priority: index + 1
  }));

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon-wrapper"><User size={48} /></div>
      <h3 className="empty-title">No Users Found</h3>
      <p className="empty-message">{searchTerm ? `No users match "${searchTerm}"` : 'No users match your current filters. Try a different selection.'}</p>
    </div>
  );

  return (
    <StyledWrapper>
      <div className="page-header">
        <div>
          <h1 className="main-title">BookHive Community</h1>
          <p className="subtitle">Discover and connect with book lovers near you.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-wrapper">
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="all">All Users</option>
            <option value="withBooks">With Books</option>
            <option value="nearby">Nearby</option>
          </select>
        </div>
        <button
          className="books-tab-btn"
          onClick={() => navigate('/books')}
          title="Browse Books"
        >
          <Library size={20} />
          <span>Books</span>
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
        >
          {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="loading-state"><Loader className="animate-spin" /></div>
        ) : filteredUsers.length > 0 ? (
          <div className={viewMode === 'grid' ? 'users-grid' : 'users-list'}>
            {filteredUsers.map((user) => {
              return viewMode === 'grid' ? (
                <UserCard key={user._id} user={user} distance={user.distance} priority={user.priority} isOnline={isUserOnline(user._id)} />
              ) : (
                <UserListItem key={user._id} user={user} distance={user.distance} priority={user.priority} isOnline={isUserOnline(user._id)} />
              );
            })}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  padding: 2rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
    
    @media (max-width: 768px) {
      margin-bottom: 1.5rem;
    }
  }
  
  .main-title { 
    font-size: 2.5rem; 
    font-weight: 800; 
    color: #111827;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
    
    @media (max-width: 480px) {
      font-size: 1.5rem;
    }
  }
  
  .subtitle { 
    font-size: 1.125rem; 
    color: #4b5563; 
    margin-top: 0.5rem;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
    
    @media (max-width: 480px) {
      font-size: 0.875rem;
    }
  }
  
  .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2.5rem;
      background-color: #ffffff;
      padding: 0.75rem;
      border-radius: 1rem;
      box-shadow: 0 4px 15px -1px rgba(0,0,0,0.05);
      flex-wrap: wrap;
      
      @media (max-width: 768px) {
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 1.5rem;
      }
  }
  
  .search-wrapper { 
    position: relative; 
    flex-grow: 1;
    min-width: 200px;
    
    @media (max-width: 768px) {
      flex-basis: 100%;
      min-width: unset;
    }
  }
  
  .search-icon { 
    position: absolute; 
    left: 1rem; 
    top: 50%; 
    transform: translateY(-50%); 
    color: #9ca3af;
    
    @media (max-width: 768px) {
      left: 0.75rem;
    }
  }
  
  .filter-wrapper {
    @media (max-width: 768px) {
      flex: 1;
      min-width: 120px;
    }
  }
  
  .filter-bar input, .filter-bar select {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: none;
      border-radius: 0.75rem;
      background-color: #f8f9fe;
      font-size: 1rem;
      font-weight: 500;
      
      @media (max-width: 768px) {
        padding: 0.625rem 0.75rem 0.625rem 2.5rem;
        font-size: 0.875rem;
      }
      
      &:focus {
          outline: none;
          box-shadow: 0 0 0 2px #c7d2fe;
      }
  }
  
  .filter-bar select {
      padding-left: 1rem;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      
      @media (max-width: 768px) {
        padding-left: 0.75rem;
        padding-right: 2rem;
      }
  }
  .books-tab-btn {
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid #4f46e5;
      background-color: #4f46e5;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      white-space: nowrap;
      
      &:hover {
          background-color: #4338ca;
          border-color: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      }
      
      span {
          font-weight: 600;
      }
      
      @media (max-width: 768px) {
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
          
          span {
              display: none; /* Hide text on mobile, show only icon */
          }
      }
  }
  
  .view-toggle-btn {
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      background-color: #f9fafb;
      color: #4b5563;
      cursor: pointer;
      display: flex;
      transition: all 0.2s ease;
      
      &:hover {
          background-color: #f3f4f6;
          border-color: #d1d5db;
      }
      
      &.active {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
          
          &:hover {
              background-color: #4338ca;
              border-color: #4338ca;
          }
      }
  }

  .content-area { min-height: 500px; }
  .loading-state {
    display: flex; justify-content: center; align-items: center; height: 500px;
    .animate-spin { width: 3rem; height: 3rem; color: #4F46E5; }
  }
  
  .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      align-items: stretch;
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1rem;
      }
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
  }
  
  .users-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      @media (max-width: 768px) {
        gap: 0.75rem;
      }
  }

  .user-card-link {
      text-decoration: none;
      color: inherit;
  }

  .user-card {
      position: relative;
      background-color: white;
      border-radius: 1.5rem;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 320px;
      transition: all 0.3s ease;
      
      &:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px -5px rgba(101, 119, 134, 0.1);
          border-color: #c7d2fe;
      }
      
      @media (max-width: 768px) {
        padding: 1.25rem;
        min-height: 300px;
        border-radius: 1.25rem;
      }
      
      @media (max-width: 480px) {
        padding: 1rem;
        min-height: 280px;
        border-radius: 1rem;
      }
  }
  .priority-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #ecc92ed4;
      color: #fff;
      padding: 0.3rem 0.7rem;
      border-radius: 50%;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(79,70,229,0.08);
      z-index: 2;
      pointer-events: none;
      min-width: unset;
      width: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 2rem;
      width: 2rem;
  }
// ...existing code...
  .avatar-container {
    position: relative;
    margin: 0 auto 1rem;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    @media (max-width: 768px) {
      width: 76px;
      height: 76px;
    }
    
    @media (max-width: 480px) {
      width: 70px;
      height: 70px;
      margin-bottom: 0.75rem;
    }
    
    &.online {
      background: #22c55e;
      padding: 4px;
      box-shadow: 
        0 0 0 3px rgba(34, 197, 94, 0.3),
        0 5px 15px rgba(34, 197, 94, 0.4);
      animation: pulse-glow-users 2s infinite;
      
      @media (max-width: 480px) {
        padding: 3px;
      }
    }
    
    &.offline {
      background: #6b7280;
      padding: 4px;
      box-shadow: 0 5px 10px rgba(0,0,0,0.1);
      
      @media (max-width: 480px) {
        padding: 3px;
      }
    }
    
    .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid white;
        
        @media (max-width: 480px) {
          border: 2px solid white;
        }
    }
    
    .online-indicator {
      display: none;
    }
  }
  
  .user-name { 
    font-size: 1.25rem; 
    font-weight: 700; 
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    line-height: 1.3;
    min-height: 2.5rem;
    
    @media (max-width: 768px) {
      font-size: 1.125rem;
      min-height: 2.25rem;
    }
    
    @media (max-width: 480px) {
      font-size: 1rem;
      min-height: 2rem;
      gap: 0.375rem;
    }
    
    .online-badge {
      font-size: 0.65rem;
      background: #22c55e;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 
        0 2px 4px rgba(34, 197, 94, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
      
      @media (max-width: 480px) {
        font-size: 0.6rem;
        padding: 0.15rem 0.4rem;
      }
    }
  }
  
  .user-tagline { 
    font-size: 0.9rem; 
    color: #6b7280; 
    margin-bottom: 1.5rem; 
    flex-grow: 1;
    min-height: 1.5rem;
    
    @media (max-width: 768px) {
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }
    
    @media (max-width: 480px) {
      font-size: 0.8rem;
      margin-bottom: 1rem;
      min-height: 1.25rem;
    }
  }
  
  .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      width: 100%;
      margin-top: auto;
      
      @media (max-width: 768px) {
        gap: 0.75rem;
      }
      
      @media (max-width: 480px) {
        gap: 0.5rem;
      }
  }
  
  .stat-item {
      background-color: #f8f9fe;
      padding: 0.75rem;
      border-radius: 0.75rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 80px;
      
      @media (max-width: 768px) {
        padding: 0.625rem 0.5rem;
        min-height: 70px;
      }
      
      @media (max-width: 480px) {
        padding: 0.5rem 0.375rem;
        min-height: 65px;
      }
      
      .stat-icon {
          color: #4f46e5;
          margin: 0 auto 0.5rem;
          
          @media (max-width: 480px) {
            width: 16px;
            height: 16px;
            margin-bottom: 0.375rem;
          }
      }
      
      span {
          display: block;
          font-size: 0.8rem;
          color: #9ca3af;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
          
          @media (max-width: 768px) {
            font-size: 0.7rem;
          }
          
          @media (max-width: 480px) {
            font-size: 0.625rem;
            margin-bottom: 0.125rem;
          }
      }
      
      strong {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          line-height: 1.2;
          
          @media (max-width: 768px) {
            font-size: 1rem;
          }
          
          @media (max-width: 480px) {
            font-size: 0.875rem;
          }
          
          &.distance-text {
            font-size: 0.95rem;
            word-break: break-word;
            hyphens: auto;
            
            @media (max-width: 768px) {
              font-size: 0.875rem;
            }
            
            @media (max-width: 480px) {
              font-size: 0.75rem;
            }
          }
      }
  }

  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 4rem 2rem; background-color: white;
    border-radius: 1rem; border: 1px dashed #d1d5db;
  }
  .empty-icon-wrapper {
    width: 5rem; height: 5rem; border-radius: 50%;
    background-color: #eef2ff; color: #4F46E5;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.5rem;
  }
  .empty-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
  .empty-message {
    font-size: 1rem; color: #6b7280; max-width: 500px;
    margin-top: 0.5rem;
  }
  
  @keyframes pulse-glow-users {
    0%, 100% {
      box-shadow: 
        0 0 0 3px rgba(34, 197, 94, 0.3),
        0 5px 15px rgba(34, 197, 94, 0.4);
    }
    50% {
      box-shadow: 
        0 0 0 6px rgba(34, 197, 94, 0.5),
        0 8px 20px rgba(34, 197, 94, 0.6);
    }
  }
  
  /* List View Styles */
  .user-list-item-link {
      text-decoration: none;
      color: inherit;
  }
  
  .user-list-item {
      position: relative;
      background-color: white;
      border-radius: 1rem;
      padding: 1rem 1.5rem;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1rem;
      min-height: 80px;
  }
  
  .priority-badge-list {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: #ecc92ed4;
      color: #fff;
      padding: 0.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 1.5rem;
      width: 1.5rem;
      z-index: 2;
  }
  
  .avatar-container-list {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      
      &.online {
        background: #22c55e;
        padding: 3px;
        box-shadow: 
          0 0 0 2px rgba(34, 197, 94, 0.3),
          0 3px 10px rgba(34, 197, 94, 0.4);
      }
      
      &.offline {
        background: #6b7280;
        padding: 3px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.1);
      }
      
      .avatar-list {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
      }
  }
  
  .user-info-list {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      
      @media (max-width: 768px) {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
      }
  }
  
  .user-main-info {
      flex: 1;
  }
  
  .user-name-list {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.25rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      
      .online-badge-list {
        font-size: 0.6rem;
        background: #22c55e;
        color: white;
        padding: 0.15rem 0.4rem;
        border-radius: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
  }
  
  .user-tagline-list {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
  }
  
  .user-stats-list {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      
      @media (max-width: 768px) {
          gap: 1rem;
          flex-wrap: wrap;
      }
  }
  
  .stat-item-list {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      
      .stat-icon-list {
          color: #4f46e5;
          flex-shrink: 0;
      }
      
      .stat-label-list {
          color: #6b7280;
          font-weight: 500;
      }
      
      .stat-value-list {
          color: #374151;
          font-weight: 600;
      }
  }
`;

export default Users;