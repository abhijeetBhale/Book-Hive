import { useState, useEffect, useMemo, useContext } from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usersAPI, borrowAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import toast from 'react-hot-toast';
import MapView from '../components/map/MapView';
import { Loader, MapPin, Search, Calendar, UserCheck, Sliders, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import SEO from '../components/SEO';
import { PAGE_SEO } from '../utils/seo';




// Utility function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const Map = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { isUserOnline, onlineCount } = useOnlineStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [showFilters, setShowFilters] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState(0); // Default 10km
  const [ratingFilter, setRatingFilter] = useState(0); // Default 0 (no filter)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [userToShowPopup, setUserToShowPopup] = useState(null);

  // Handle user popup from navigation state
  useEffect(() => {
    if (location.state?.showUserPopup) {
      setUserToShowPopup(location.state.showUserPopup);
      // Clear the state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // If user is an organizer, fetch their events instead of users
        if (currentUser?.role === 'organizer') {
          try {
            const { organizerAPI } = await import('../utils/api');
            const response = await organizerAPI.getOrganizerEventsForMap();
            // Transform events to match user structure for map display
            const eventMarkers = (response.data || []).map(event => ({
              _id: event._id,
              name: event.title,
              location: event.location,
              isEvent: true,
              eventData: event
            }));
            setUsers(eventMarkers);
            setSelectedUserIds(eventMarkers.map(e => e._id));
          } catch (error) {
            console.error('Failed to load organizer events:', error);
            toast.error('Failed to load your events');
            setUsers([]);
          }
          setLoading(false);
          return;
        }

        if (!currentUser?.location?.coordinates || currentUser.location.coordinates.length !== 2) {
          toast.error('Please set your location in your profile to use distance filtering.');
          setUsers([]);
          setLoading(false);
          return;
        }

        const { data } = await usersAPI.getUsersWithBooks();
        let usersWithCoords = data.users.filter(user =>
          user.location?.coordinates &&
          user.location.coordinates.length === 2 &&
          user._id !== currentUser?._id
        );

        const currentUserLat = currentUser.location.coordinates[1];
        const currentUserLon = currentUser.location.coordinates[0];

        usersWithCoords = usersWithCoords.map(user => {
          const userLat = user.location.coordinates[1];
          const userLon = user.location.coordinates[0];
          const distance = calculateDistance(currentUserLat, currentUserLon, userLat, userLon);

          return {
            ...user,
            distanceFromCurrentUser: distance,
            isOnline: isUserOnline(user._id)
          };
        });

        if (distanceFilter > 0) {
          usersWithCoords = usersWithCoords.filter(user =>
            user.distanceFromCurrentUser <= distanceFilter
          );
        }

        if (ratingFilter > 0) {
          usersWithCoords = usersWithCoords.filter(user =>
            user.rating?.value >= ratingFilter
          );
        }

        usersWithCoords.sort((a, b) => a.distanceFromCurrentUser - b.distanceFromCurrentUser);

        setUsers(usersWithCoords);
        setSelectedUserIds(usersWithCoords.map(u => u._id));
      } catch (error) {
        console.error('Failed to load user locations:', error);
        toast.error('Failed to load user locations.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [distanceFilter, ratingFilter, currentUser]);



  const handleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const sidebarFilteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]
  );

  const usersForMap = useMemo(() => {
    const selectedAndSearchedUsers = users.filter(user =>
      selectedUserIds.includes(user._id) &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      user.location?.coordinates &&
      user.location.coordinates.length === 2
    );
    return selectedAndSearchedUsers;
  }, [users, selectedUserIds, searchTerm]);



  return (
    <>
      <SEO 
        title={PAGE_SEO.map.title}
        description={PAGE_SEO.map.description}
        keywords={PAGE_SEO.map.keywords}
        url={PAGE_SEO.map.url}
      />
      <StyledWrapper>
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {!sidebarCollapsed && (
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h3>Community Members</h3>
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="filter-button"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Sliders size={18} />
                </button>
              </div>
              {showFilters && (
                <div className="filter-panel">
                  <div className="filter-group">
                    <label>Distance from you (km)</label>
                    <div className="range-container">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={distanceFilter}
                        onChange={(e) => setDistanceFilter(parseInt(e.target.value))}
                      />
                      <span>{distanceFilter > 0 ? `${distanceFilter} km` : 'No limit'}</span>
                    </div>
                  </div>
                  <div className="filter-group">
                    <label>Minimum Rating</label>
                    <div className="range-container">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(parseFloat(e.target.value))}
                      />
                      <span>{ratingFilter > 0 ? `${ratingFilter} ★` : 'Any'}</span>
                    </div>
                  </div>
                  <div className="filter-info">
                    <small>Showing users within {distanceFilter > 0 ? `${distanceFilter}km` : 'unlimited distance'} from your location</small>
                  </div>
                </div>
              )}
            </div>
            <div className="user-list">
              {loading ? (
                <div className="loader-container"><Loader className="animate-spin" /></div>
              ) : (
                sidebarFilteredUsers.map(user => (
                  <div
                    key={user._id}
                    className={`user-item ${selectedUserIds.includes(user._id) ? 'selected' : ''}`}
                  >
                    <div
                      className="checkbox"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUserSelection(user._id);
                      }}
                    >
                      {selectedUserIds.includes(user._id) && <UserCheck size={14} />}
                    </div>
                    <Link to={`/profile/${user._id}`} className="user-link">
                      <div className={`avatar-container ${user.isOnline ? 'online' : 'offline'}`}>
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                      </div>
                      <div className="user-info">
                        <div className="user-main-info">
                          <span className="user-name">
                            {user.name}
                            {user.isOnline && <span className="online-badge">Online</span>}
                          </span>
                          <div className="user-stats">
                            <span className="book-count">{(user.booksOwned || []).length} Books</span>
                            {user.rating?.value && (
                              <span className="user-rating">
                                <Star size={12} fill="currentColor" />
                                {user.rating.value.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="distance-info">
                          <span className="distance">
                            {user.distanceFromCurrentUser ?
                              `${user.distanceFromCurrentUser.toFixed(1)} km away` :
                              'Distance unknown'
                            }
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="map-header">
          <div className="header-content">
            <h2>Community Activity</h2>
            <div className="online-status">
              <div className="online-indicator-header online"></div>
              <span className="online-count">{onlineCount}</span>
              <div className="online-tooltip">
                <div className="tooltip-indicator online"></div>
                <span className="tooltip-text">{onlineCount} users are using BookHive</span>
              </div>
            </div>
          </div>
          <div className="controls">
            <button
              className="control-btn"
              onClick={() => navigate('/calendar')}
            >
              <Calendar size={16} /> Calendar
            </button>
            <button
              className="control-btn active"
            >
              <MapPin size={16} /> Map
            </button>
          </div>
        </div>
        <div className="map-container">
          {loading ? (
            <div className="loader-container"><Loader className="animate-spin h-12 w-12" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <MapPin className="h-16 w-16" />
              <h3>No Users Found</h3>
              {!currentUser?.location?.coordinates ? (
                <p>Please set your location in your profile to see nearby users and use distance filtering.</p>
              ) : (
                <p>No users found within your selected distance and rating criteria. Try adjusting your filters.</p>
              )}
            </div>
          ) : (
            <MapView key="main-map" userGroups={[usersForMap]} userToShowPopup={userToShowPopup} />
          )}
        </div>
      </div>
      </StyledWrapper>
    </>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  height: calc(100vh - 80px);
  width: 100%;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;

  /* Mobile-first responsive design */
  @media (max-width: 768px) {
    flex-direction: column;
    height: calc(100vh - 60px); /* Adjust for mobile header */
  }

  .sidebar {
    width: 320px;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
    transition: all 0.3s ease;
    overflow: hidden;
    
    &.collapsed {
      width: 60px;
    }

    /* Mobile responsive sidebar */
    @media (max-width: 768px) {
      width: 100%;
      height: auto;
      max-height: 40vh;
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
      
      &.collapsed {
        width: 100%;
        height: 60px;
        max-height: 60px;
      }
    }
  }

  .collapse-btn {
    position: absolute;
    top: 20px;
    right: 15px;
    z-index: 10;
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #4338ca;
      transform: scale(1.05);
    }

    /* Mobile positioning */
    @media (max-width: 768px) {
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
    }
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    /* Mobile responsive sidebar header */
    @media (max-width: 768px) {
      padding: 1rem;
      
      h3 {
        font-size: 1.125rem;
      }
    }
  }

  .search-box {
    position: relative;
    margin-top: 1rem;
    display: flex;
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    input {
      flex: 1;
      padding: 0.6rem 0.6rem 0.6rem 2.25rem;
      border-radius: 0.5rem 0 0 0.5rem;
      border: 1px solid #e2e8f0;
      border-right: none;
      background: #f8fafc;
      &:focus {
        outline: none;
        border-color: #4F46E5;
        background: white;
      }
    }
    .filter-button {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: none;
      border-radius: 0 0.5rem 0.5rem 0;
      padding: 0 0.75rem;
      display: flex;
      align-items: center;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: #f1f5f9;
        color: #334155;
      }
    }
  }
  
  .filter-panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .filter-group {
    margin-bottom: 1rem;
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
      margin-bottom: 0.5rem;
    }
    
    .range-container {
      display: flex;
      align-items: center;
      
      input[type="range"] {
        flex: 1;
        margin-right: 1rem;
        accent-color: #4F46E5;
      }
      
      span {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
        width: 70px;
        text-align: right;
      }
    }
  }

  .filter-info {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
    
    small {
      color: #64748b;
      font-size: 0.75rem;
      font-style: italic;
    }
  }

  .user-list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;

    /* Mobile responsive user list */
    @media (max-width: 768px) {
      padding: 0.75rem;
      max-height: 200px; /* Limit height on mobile */
    }
  }
  
  .user-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
    margin-bottom: 0.5rem;

    &:hover {
      background-color: #f1f5f9;
    }

    &.selected {
      background-color: #eef2ff;
      .checkbox {
        background-color: #4F46E5;
        border-color: #4F46E5;
        color: white;
      }
    }

    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 0.375rem;
      margin-right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      cursor: pointer;
    }
    
    .user-link {
      display: flex;
      align-items: center;
      flex: 1;
      text-decoration: none;
      color: inherit;
      
      .avatar-container {
        position: relative;
        margin-right: 0.75rem;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        
        &.online {
          background: #22c55e;
          padding: 3px;
          box-shadow: 
            0 0 0 2px rgba(34, 197, 94, 0.3),
            0 2px 8px rgba(34, 197, 94, 0.4);
          animation: pulse-glow 2s infinite;
        }
        
        &.offline {
          background: #6b7280;
          padding: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
        }
        
        .online-indicator {
          display: none;
        }
      }

      .user-info {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .user-main-info {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.25rem;
      }
      
      .user-name {
        font-weight: 600;
        color: #334155;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
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
        }
      }

      .user-stats {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.125rem;
      }

      .book-count {
        font-size: 0.75rem;
        color: #64748b;
      }

      .user-rating {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #f59e0b;
        font-weight: 500;
      }

      .distance-info {
        margin-top: 0.25rem;
      }

      .distance {
        font-size: 0.7rem;
        color: #4F46E5;
        font-weight: 500;
        background-color: #eef2ff;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        display: inline-block;
      }
    }
  }

  .main-content {
    flex-grow: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    
    &.expanded {
      flex-grow: 1;
    }

    /* Mobile responsive main content */
    @media (max-width: 768px) {
      padding: 1rem;
      flex: 1;
      min-height: 0; /* Allow flex child to shrink */
    }
  }
  
  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      h2 {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }
      
      .online-status {
        display: flex;
        align-items: center;
        gap: .625rem;
        background: #ffffff;
        padding: 0.225rem 1rem;
        border-radius: 50px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        position: relative;
        margin-top: 7px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: #4F46E5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
          
          .online-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
          }
        }
        
        .online-indicator-header {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
          
          &.online {
            background: #22c55e;
            box-shadow: 
              0 0 0 2px rgba(34, 197, 94, 0.2),
              0 0 6px rgba(34, 197, 94, 0.4);
            animation: pulse-glow 2s infinite;
          }
        }
        
        .online-count {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
        }
        
        .online-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: -19%;
          transform: translateY(-50%) translateX(-10px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          white-space: nowrap;
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.1),
            0 4px 10px rgba(0, 0, 0, 0.05);
          opacity: 0;
          visibility: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          
          &::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
            background: #ffffff;
            border-left: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            z-index: -1;
          }
          
          .tooltip-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            
            &.online {
              background: #22c55e;
              box-shadow: 
                0 0 0 2px rgba(34, 197, 94, 0.2),
                0 0 6px rgba(34, 197, 94, 0.4);
              animation: pulse-glow 2s infinite;
            }
          }
          
          .tooltip-text {
            font-size: 0.875rem;
            font-weight: 600;
            color: #334155;
            letter-spacing: 0.01em;
          }
        }
      }
      
      @keyframes shimmer {
        0%, 100% {
          transform: translateX(-100%);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
      }
    }

    /* Mobile responsive header */
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;

      .header-content {
        width: 100%;
        justify-content: space-between;
        
        h2 {
          font-size: 1.5rem;
        }
        
        .online-status {
          padding: 0.5rem 0.875rem;
          
          .online-indicator-header {
            width: 8px;
            height: 8px;
          }
          
          .online-count {
            font-size: 1rem;
          }
          
          .online-tooltip {
            left: auto;
            right: calc(100% + 12px);
            padding: 0.625rem 0.875rem;
            
            &::before {
              left: auto;
              right: -6px;
              border-left: none;
              border-bottom: none;
              border-right: 1px solid #e2e8f0;
              border-top: 1px solid #e2e8f0;
            }
            
            .tooltip-indicator {
              width: 8px;
              height: 8px;
            }
            
            .tooltip-text {
              font-size: 0.8rem;
            }
          }
        }
      }
    }
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 
        0 0 0 2px rgba(34, 197, 94, 0.3),
        0 2px 8px rgba(34, 197, 94, 0.4);
    }
    50% {
      box-shadow: 
        0 0 0 4px rgba(34, 197, 94, 0.5),
        0 4px 12px rgba(34, 197, 94, 0.6);
    }
  }

  .controls {
    display: flex;
    background-color: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.5rem;
    .control-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #475569;
      &.active {
        background-color: white;
        color: #1e293b;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
    }

    /* Mobile responsive controls */
    @media (max-width: 768px) {
      width: 100%;
      
      .control-btn {
        flex: 1;
        justify-content: center;
        padding: 0.75rem 0.5rem;
        font-size: 0.875rem;
      }
    }
  }

  .map-container {
    flex-grow: 1;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);

    /* Mobile responsive map container */
    @media (max-width: 768px) {
      flex: 1;
      min-height: 300px;
      border-radius: 0.5rem;
    }
  }

  .loader-container, .empty-state, .calendar-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background-color: white;
    color: #475569;
    text-align: center;
    padding: 2rem;
    .animate-spin { 
        color: #4F46E5; 
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1rem; color: #1e293b; }
    p { margin-top: 0.25rem; max-width: 400px; }
    svg { color: #cbd5e1; }
  }

  .calendar-container {
    height: 100%;
    background-color: white;
    padding: 1rem;
    border-radius: 1rem;
  }
`;

export default Map;
