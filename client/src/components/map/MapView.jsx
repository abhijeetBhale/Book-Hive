import React, { useState, useEffect, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BookOpen, Star, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { eventsAPI } from '../../utils/api';
import { formatLastSeen } from '../../utils/timeHelpers';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import VerifiedBadge from '../ui/VerifiedBadge';
import EventRegistrationModal from '../events/EventRegistrationModal';

// Error Boundary Component
class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Map initialization error caught:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: '#f8fafc',
                    color: '#64748b',
                    flexDirection: 'column',
                    padding: '2rem'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>Map Loading Issue</h3>
                    <p style={{ margin: '0', textAlign: 'center' }}>
                        The map is temporarily unavailable. Please refresh the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#4F46E5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Safe Map Container Component
const SafeMapContainer = ({ children, center, zoom, mapKey }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Cleanup any existing leaflet containers in this element
        if (containerRef.current) {
            const existingMaps = containerRef.current.querySelectorAll('.leaflet-container');
            existingMaps.forEach(mapEl => {
                if (mapEl._leaflet_id) {
                    try {
                        // Try to remove the map instance
                        const mapInstance = window.L?.map?._getMap?.(mapEl._leaflet_id);
                        if (mapInstance && mapInstance.remove) {
                            mapInstance.remove();
                        }
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            });
        }
    }, [mapKey]);

    return (
        <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
            <MapContainer
                key={mapKey}
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                {children}
            </MapContainer>
        </div>
    );
};

// This wrapper component is crucial for applying global styles to override Leaflet's defaults.
const StyledMapWrapper = styled.div`
  height: 100%;
  width: 100%;
  position: relative; 

  .leaflet-popup-content-wrapper {
    background-color: transparent;
    box-shadow: none;
    padding: 0;
  }
  .leaflet-popup-content {
    margin: 0 !important;
  }
  .leaflet-popup-tip {
    display: none;
  }
  .leaflet-popup-close-button {
    display: none;
  }
`;

// This is the custom-styled popup card with the close button
const PopupCard = styled.div`
  position: relative;
  width: 280px;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  padding: 1.5rem;
  
  .close-popup-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #ffffff;
    border: 2px solid #e5e7eb;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
        background: #f3f4f6;
        color: #111827;
        border-color: #d1d5db;
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }
  }
  
  .card-header {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .avatar-wrapper {
    padding: 4px;
    border-radius: 50%;
    background: linear-gradient(45deg, #818cf8, #c084fc);
  }
  
  .avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid white;
  }
  
  .card-body {
    text-align: center;
    h2 { 
      font-size: 1.5rem; 
      font-weight: 700; 
      color: #111827; 
      margin: 0;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.5rem !important;
    }
    
    .member-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin: 0.25rem 0 1.5rem 0;
      
      > span {
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        
        &.online {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #065f46;
          border: 1px solid rgba(34, 197, 94, 0.2);
          box-shadow: 0 2px 4px rgba(34, 197, 94, 0.1);
          
          .status-dot {
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            box-shadow: 
              0 0 0 2px rgba(34, 197, 94, 0.3),
              0 1px 3px rgba(34, 197, 94, 0.4);
            animation: pulse-dot-simple 2s infinite;
          }
        }
        
        &.offline {
          background-color: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          
          .status-dot {
            width: 8px;
            height: 8px;
            background: linear-gradient(135deg, #9ca3af, #6b7280);
            border-radius: 50%;
          }
        }
      }
    }
  }

  .last-seen-text-popup {
    font-size: 0.75rem;
    color: #9ca3af;
    text-align: center;
    margin-top: 0.5rem;
    font-weight: 500;
  }

  .stats {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 0.75rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4b5563;
    strong { font-size: 1.125rem; font-weight: 600; color: #1e293b; }
  }

  .card-footer {
      margin-top: 1.5rem;
  }
  
  .profile-btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background-color: #111827;
      color: white;
      text-align: center;
      text-decoration: none;
      font-weight: 600;
      border-radius: 0.5rem;
      transition: background-color 0.2s;
      &:hover { background-color: #374151; }
  }
`;



// Component to automatically adjust map bounds
const MapBoundsAdjuster = ({ allUsers, userToShowPopup }) => {
    const map = useMap();
    useEffect(() => {
        if (userToShowPopup && userToShowPopup.location?.coordinates) {
            // Center on specific user with higher zoom
            const position = [userToShowPopup.location.coordinates[1], userToShowPopup.location.coordinates[0]];
            map.setView(position, 15, { animate: true });
        } else if (allUsers && allUsers.length > 0) {
            const bounds = L.latLngBounds(
                allUsers.map(user => [
                    user.location.coordinates[1],
                    user.location.coordinates[0]
                ])
            );
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [allUsers, userToShowPopup, map]);
    return null;
};


const MapView = ({ userGroups, userToShowPopup }) => {
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const defaultPosition = [22.7196, 75.8577]; // Default center for Indore
    const [selectedPin, setSelectedPin] = useState(null);
    const [mapKey, setMapKey] = useState(() => `map-${Date.now()}-${Math.random()}`);
    const [hasProcessedUserToShow, setHasProcessedUserToShow] = useState(false);

    // Flatten userGroups to individual users for clustering
    const allUsers = userGroups.flat();

    // Use only real user data
    const usersToDisplay = allUsers;

    // Force remount when userGroups change to prevent initialization errors
    useEffect(() => {
        setMapKey(`map-${Date.now()}-${Math.random()}`);
    }, [userGroups]);

    // Reset processed flag when userToShowPopup changes
    useEffect(() => {
        if (userToShowPopup) {
            setHasProcessedUserToShow(false);
        }
    }, [userToShowPopup]);

    // Handle userToShowPopup - automatically select and show their popup (only once)
    useEffect(() => {
        if (userToShowPopup && !hasProcessedUserToShow) {
            // Find the user in the current users list or use the provided user data
            const userInList = allUsers.find(user => user._id === userToShowPopup._id);
            if (userInList) {
                setSelectedPin(userInList);
            } else {
                // If user is not in the current list, use the provided user data
                setSelectedPin(userToShowPopup);
            }
            setHasProcessedUserToShow(true);
        }
    }, [userToShowPopup, allUsers, hasProcessedUserToShow]);

    // Handle keyboard events for closing popup
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedPin) {
                setSelectedPin(null);
            }
        };

        if (selectedPin) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedPin]);



    const createUserIcon = (user) => {
        // Create event icon if this is an event
        if (user.isEvent) {
            return L.divIcon({
                html: `
                    <div class="custom-event-marker">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                `,
                className: '',
                iconSize: [50, 50],
                iconAnchor: [25, 50],
                popupAnchor: [0, -52]
            });
        }

        // Create user icon
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;
        const onlineClass = user.isOnline ? 'online' : 'offline';

        return L.divIcon({
            html: `
                <div class="custom-marker-wrapper ${onlineClass}">
                    <img src="${avatarUrl}" alt="${user.name}" class="custom-marker-image" />
                </div>
            `,
            className: '',
            iconSize: [50, 50],
            iconAnchor: [25, 50],
            popupAnchor: [0, -52]
        });
    };

    const customMarkerStyles = `
        .custom-event-marker {
            position: relative;
            width: 50px;
            height: 50px;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            box-shadow: 
              0 0 0 3px rgba(245, 158, 11, 0.3),
              0 4px 12px rgba(245, 158, 11, 0.5);
            transition: transform 0.2s ease;
            animation: pulse-event 2s infinite;
        }

        @keyframes pulse-event {
            0%, 100% {
                box-shadow: 
                  0 0 0 3px rgba(245, 158, 11, 0.3),
                  0 4px 12px rgba(245, 158, 11, 0.5);
            }
            50% {
                box-shadow: 
                  0 0 0 6px rgba(245, 158, 11, 0.4),
                  0 6px 16px rgba(245, 158, 11, 0.6);
            }
        }

        .leaflet-marker-icon:hover .custom-event-marker {
            transform: scale(1.1);
        }

        .custom-marker-wrapper {
            position: relative;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }
        
        .custom-marker-wrapper.online {
            background: #22c55e;
            padding: 4px;
            box-shadow: 
              0 0 0 2px rgba(34, 197, 94, 0.3),
              0 4px 12px rgba(34, 197, 94, 0.4);
            animation: pulse-ring-online 2s infinite;
        }
        
        .custom-marker-wrapper.offline {
            background: #6b7280;
            padding: 3px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        @keyframes pulse-ring-online {
            0%, 100% {
                box-shadow: 
                  0 0 0 2px rgba(34, 197, 94, 0.3),
                  0 4px 12px rgba(34, 197, 94, 0.4);
            }
            50% {
                box-shadow: 
                  0 0 0 6px rgba(34, 197, 94, 0.5),
                  0 6px 16px rgba(34, 197, 94, 0.6);
            }
        }
        

        
        .leaflet-marker-icon:hover .custom-marker-wrapper { transform: scale(1.1); }
        .custom-marker-image { 
            width: 100%; 
            height: 100%; 
            border-radius: 50%; 
            object-fit: cover;
            border: 2px solid white;
        }
        
        @keyframes pulse-dot-simple {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.6;
            }
        }
        
        /* Custom cluster styles */
        .marker-cluster-small {
            background-color: rgba(79, 70, 229, 0.2);
            border: 3px solid rgba(79, 70, 229, 0.4);
        }
        .marker-cluster-small div {
            background-color: #4F46E5;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
        }
        .marker-cluster-medium {
            background-color: rgba(99, 102, 241, 0.2);
            border: 3px solid rgba(99, 102, 241, 0.4);
        }
        .marker-cluster-medium div {
            background-color: #6366F1;
            box-shadow: 0 3px 10px rgba(99, 102, 241, 0.4);
        }
        .marker-cluster-large {
            background-color: rgba(129, 140, 248, 0.2);
            border: 3px solid rgba(129, 140, 248, 0.4);
        }
        .marker-cluster-large div {
            background-color: #818CF8;
            box-shadow: 0 4px 12px rgba(129, 140, 248, 0.5);
        }
        .marker-cluster {
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        .marker-cluster:hover {
            transform: scale(1.1);
        }
        .marker-cluster div {
            border-radius: 50%;
            color: white;
            font-weight: bold;
            text-align: center;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            transition: all 0.2s ease;
        }
        .marker-cluster div span {
            font-size: 14px;
            line-height: 1;
        }
        .marker-cluster-large div span {
            font-size: 16px;
        }
        
        /* Base cluster styles */
        .leaflet-cluster-anim .leaflet-marker-icon, .leaflet-cluster-anim .leaflet-marker-shadow {
            -webkit-transition: -webkit-transform 0.3s ease-out, opacity 0.3s ease-in;
            -moz-transition: -moz-transform 0.3s ease-out, opacity 0.3s ease-in;
            -o-transition: -o-transform 0.3s ease-out, opacity 0.3s ease-in;
            transition: transform 0.3s ease-out, opacity 0.3s ease-in;
        }
        
        .leaflet-cluster-spider-leg {
            /* stroke-dashoffset (duration and function) should match with leaflet-marker-icon transform in order to track it exactly */
            -webkit-transition: -webkit-stroke-dashoffset 0.3s ease-out, -webkit-stroke-opacity 0.3s ease-in;
            -moz-transition: -moz-stroke-dashoffset 0.3s ease-out, -moz-stroke-opacity 0.3s ease-in;
            -o-transition: -o-stroke-dashoffset 0.3s ease-out, -o-stroke-opacity 0.3s ease-in;
            transition: stroke-dashoffset 0.3s ease-out, stroke-opacity 0.3s ease-in;
        }
    `;

    const handleMarkerClick = (user) => {
        setSelectedPin(user);
    }

    const handleClosePopup = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSelectedPin(null);
    }

    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [eventToRegister, setEventToRegister] = useState(null);

    const handleRegisterForEvent = (event) => {
        if (!currentUser) {
            toast.error('Please login to register for events');
            navigate('/login');
            return;
        }

        setEventToRegister(event);
        setShowRegistrationModal(true);
    }

    const handleRegistrationSuccess = () => {
        setShowRegistrationModal(false);
        setEventToRegister(null);
        setSelectedPin(null);
    }

    return (
        <MapErrorBoundary>
            <style>{customMarkerStyles}</style>
            <StyledMapWrapper>
                <SafeMapContainer
                    center={defaultPosition}
                    zoom={12}
                    mapKey={mapKey}
                >
                    <MapBoundsAdjuster allUsers={usersToDisplay} userToShowPopup={userToShowPopup} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MarkerClusterGroup
                        chunkedLoading={true}
                        maxClusterRadius={50}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                        disableClusteringAtZoom={15}
                    >
                        {(() => {
                            // Get all users to display
                            let allUsersToShow = usersToDisplay.filter(user =>
                                user.location &&
                                user.location.coordinates &&
                                user.location.coordinates.length === 2 &&
                                !isNaN(user.location.coordinates[0]) &&
                                !isNaN(user.location.coordinates[1])
                            );

                            // Add userToShowPopup if not already in the list
                            if (userToShowPopup &&
                                userToShowPopup.location?.coordinates &&
                                userToShowPopup.location.coordinates.length === 2 &&
                                !allUsersToShow.find(user => user._id === userToShowPopup._id)) {
                                allUsersToShow = [...allUsersToShow, userToShowPopup];
                            }

                            return allUsersToShow.map((user) => {
                                const position = [user.location.coordinates[1], user.location.coordinates[0]];
                                const key = `user-${user._id}`;

                                return (
                                    <Marker
                                        key={key}
                                        position={position}
                                        icon={createUserIcon(user)}
                                        eventHandlers={{ click: () => handleMarkerClick(user) }}
                                    />
                                );
                            });
                        })()}
                    </MarkerClusterGroup>

                    {selectedPin && (
                        <Popup
                            key={`popup-${selectedPin._id}-${Date.now()}`}
                            position={[selectedPin.location.coordinates[1], selectedPin.location.coordinates[0]]}
                            closeButton={true}
                            closeOnClick={true}
                            autoPan={true}
                            eventHandlers={{
                                remove: () => {
                                    setSelectedPin(null);
                                }
                            }}
                        >
                            <PopupCard onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="close-popup-btn"
                                    onClick={handleClosePopup}
                                    type="button"
                                >
                                    <X size={16} />
                                </button>
                                {selectedPin.isEvent ? (
                                    // Event Popup
                                    <>
                                        <div className="card-header">
                                            <div className="avatar-wrapper" style={{ background: 'linear-gradient(45deg, #f59e0b, #d97706)' }}>
                                                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <h2>{selectedPin.name}</h2>
                                            <div className="member-status">
                                                <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                                                    {selectedPin.eventData?.eventType ? selectedPin.eventData.eventType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'BookHive Event'}
                                                </span>
                                                <div className="status-indicator" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                    <div className="status-dot" style={{ background: '#f59e0b' }}></div>
                                                    <span>
                                                        {selectedPin.eventData?.startAt 
                                                            ? new Date(selectedPin.eventData.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                            : 'Date TBD'}
                                                    </span>
                                                </div>
                                            </div>

                                            {selectedPin.eventData?.description && (
                                                <div style={{ margin: '1rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5', maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {selectedPin.eventData.description.length > 120 
                                                        ? selectedPin.eventData.description.substring(0, 120) + '...' 
                                                        : selectedPin.eventData.description}
                                                </div>
                                            )}

                                            {selectedPin.eventData?.location?.venue && (
                                                <div style={{ margin: '0.75rem 0', padding: '0.75rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                        <circle cx="12" cy="10" r="3"></circle>
                                                    </svg>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>{selectedPin.eventData.location.venue}</div>
                                                        {selectedPin.eventData.location.address && (
                                                            <div style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}>{selectedPin.eventData.location.address}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="stats">
                                                <div className="stat-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                    <strong>{selectedPin.eventData?.currentRegistrations || 0}</strong>
                                                    <span>Registered</span>
                                                </div>
                                                <div className="stat-item">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    <strong>
                                                        {selectedPin.eventData?.startAt 
                                                            ? new Date(selectedPin.eventData.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                                            : 'TBD'}
                                                    </strong>
                                                    <span>Start Time</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            {(() => {
                                                const isOrganizer = currentUser && selectedPin.eventData?.organizer && 
                                                    (currentUser._id === selectedPin.eventData.organizer._id || currentUser._id === selectedPin.eventData.organizer);
                                                const isRegistered = selectedPin.eventData?.registrations?.some(reg => reg.user === currentUser?._id || reg.user?._id === currentUser?._id);
                                                const isFull = selectedPin.eventData?.capacity > 0 && selectedPin.eventData?.currentRegistrations >= selectedPin.eventData?.capacity;
                                                const isPast = selectedPin.eventData?.endAt && new Date(selectedPin.eventData.endAt) < new Date();

                                                if (isOrganizer) {
                                                    return (
                                                        <Link to={`/events/${selectedPin._id}`} className="profile-btn" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                                            Manage Event
                                                        </Link>
                                                    );
                                                } else if (isPast) {
                                                    return (
                                                        <Link to={`/events/${selectedPin._id}`} className="profile-btn" style={{ background: '#6b7280' }}>
                                                            View Past Event
                                                        </Link>
                                                    );
                                                } else if (isRegistered) {
                                                    return (
                                                        <Link to={`/events/${selectedPin._id}`} className="profile-btn" style={{ background: '#10b981' }}>
                                                            ✓ Registered - View Details
                                                        </Link>
                                                    );
                                                } else if (isFull) {
                                                    return (
                                                        <Link to={`/events/${selectedPin._id}`} className="profile-btn" style={{ background: '#6b7280' }}>
                                                            Event Full - View Details
                                                        </Link>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button 
                                                                onClick={() => handleRegisterForEvent(selectedPin)} 
                                                                className="profile-btn" 
                                                                style={{ 
                                                                    background: 'linear-gradient(135deg, #10b981, #059669)', 
                                                                    flex: 1
                                                                }}
                                                            >
                                                                Register Now
                                                            </button>
                                                            <Link 
                                                                to={`/events/${selectedPin._id}`} 
                                                                className="profile-btn" 
                                                                style={{ 
                                                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                                    flex: 1
                                                                }}
                                                            >
                                                                View Details
                                                            </Link>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </>
                                ) : (
                                    // User Popup
                                    <>
                                        <div className="card-header">
                                            <div className="avatar-wrapper">
                                                <img src={selectedPin.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPin.name)}&background=random&color=fff`} alt={selectedPin.name} className="avatar" />
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {selectedPin.name}
                                                {selectedPin.isVerified && <VerifiedBadge size={18} />}
                                            </h2>
                                            <div className="member-status">
                                                <span>Community Member</span>
                                                <div className={`status-indicator ${selectedPin.isOnline ? 'online' : 'offline'}`}>
                                                    <div className="status-dot"></div>
                                                    <span>
                                                      {selectedPin.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                                {!selectedPin.isOnline && (selectedPin.lastSeenFormatted || formatLastSeen(selectedPin.lastSeen)) && (
                                                  <div className="last-seen-text-popup">
                                                    {selectedPin.lastSeenFormatted || formatLastSeen(selectedPin.lastSeen)}
                                                  </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1.5rem 0', padding: '0 0', gap: '0.2rem', fontSize: '0.8rem', color: '#6b7280' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                    <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                                                        {selectedPin.friendsCount || 0}
                                                    </span>
                                                    <span>Followers</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                    <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                                                        {selectedPin.contributions || 0}
                                                    </span>
                                                    <span>Contributions</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                    <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        {selectedPin.createdAt ? new Date(selectedPin.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recent'}
                                                    </span>
                                                    <span>Joined</span>
                                                </div>
                                            </div>

                                            <div className="stats">
                                                <div className="stat-item">
                                                    <BookOpen size={18} />
                                                    <strong>{(selectedPin.booksOwned || []).length}</strong>
                                                    <span>Books</span>
                                                </div>
                                                <div className="stat-item">
                                                    <Star size={18} />
                                                    <strong>{selectedPin.rating?.value ? selectedPin.rating.value.toFixed(1) : 'N/A'}</strong>
                                                    <span>Rating</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-footer">
                                            <Link to={`/profile/${selectedPin._id}`} className="profile-btn">
                                                View Profile
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </PopupCard>
                        </Popup>
                    )}
                </SafeMapContainer>
            </StyledMapWrapper>

            {/* Event Registration Modal */}
            <EventRegistrationModal
                isOpen={showRegistrationModal}
                onClose={() => {
                    setShowRegistrationModal(false);
                    setEventToRegister(null);
                }}
                event={eventToRegister}
                onSuccess={handleRegistrationSuccess}
            />
        </MapErrorBoundary>
    );
};

export default MapView;