import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { BookOpen, Star, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

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
    top: 12px;
    right: 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s;

    &:hover {
        background: #e5e7eb;
        color: #111827;
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
    h2 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
    p { font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 1.5rem 0; }
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
const MapBoundsAdjuster = ({ allUsers }) => {
    const map = useMap();
    useEffect(() => {
        if (allUsers && allUsers.length > 0) {
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
    }, [allUsers, map]);
    return null;
};


const MapView = ({ userGroups }) => {
    const defaultPosition = [22.7196, 75.8577]; // Default center for Indore
    const [selectedPin, setSelectedPin] = useState(null);

    // Flatten userGroups to individual users for clustering
    const allUsers = userGroups.flat();

    // Debug logging
    // console.log('MapView - userGroups:', userGroups);
    // console.log('MapView - allUsers:', allUsers);
    // console.log('MapView - allUsers length:', allUsers.length);

    // Use only real user data
    const usersToDisplay = allUsers;

    const createUserIcon = (user) => {
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;

        return L.divIcon({
            html: `<div class="custom-marker-wrapper"><img src="${avatarUrl}" alt="${user.name}" class="custom-marker-image" /></div>`,
            className: '',
            iconSize: [46, 46],
            iconAnchor: [23, 46],
            popupAnchor: [0, -48]
        });
    };

    const customMarkerStyles = `
        .custom-marker-wrapper {
            position: relative; border-radius: 50%; padding: 3px;
            background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: transform 0.2s ease;
        }
        .leaflet-marker-icon:hover .custom-marker-wrapper { transform: scale(1.1); }
        .custom-marker-image { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        
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

    return (
        <>
            <style>{customMarkerStyles}</style>
            <StyledMapWrapper>
                <MapContainer center={defaultPosition} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <MapBoundsAdjuster allUsers={usersToDisplay} />
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
                        {usersToDisplay.filter(user =>
                            user.location &&
                            user.location.coordinates &&
                            user.location.coordinates.length === 2 &&
                            !isNaN(user.location.coordinates[0]) &&
                            !isNaN(user.location.coordinates[1])
                        ).map((user) => {
                            const position = [user.location.coordinates[1], user.location.coordinates[0]];
                            const key = `user-${user._id}`;

                            // console.log('Creating marker for user:', user.name, 'at position:', position);

                            return (
                                <Marker
                                    key={key}
                                    position={position}
                                    icon={createUserIcon(user)}
                                    eventHandlers={{ click: () => handleMarkerClick(user) }}
                                />
                            );
                        })}
                    </MarkerClusterGroup>

                    {selectedPin && (
                        <Popup
                            position={[selectedPin.location.coordinates[1], selectedPin.location.coordinates[0]]}
                            onClose={() => setSelectedPin(null)}
                            closeButton={false}
                            closeOnClick={false}
                            autoPan={true}
                        >
                            <PopupCard>
                                <button className="close-popup-btn" onClick={() => setSelectedPin(null)}>
                                    <X size={16} />
                                </button>
                                <div className="card-header">
                                    <div className="avatar-wrapper">
                                        <img src={selectedPin.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPin.name)}&background=random&color=fff`} alt={selectedPin.name} className="avatar" />
                                    </div>
                                </div>
                                <div className="card-body">
                                    <h2>{selectedPin.name}</h2>
                                    <p>Community Member</p>
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
                            </PopupCard>
                        </Popup>
                    )}
                </MapContainer>
            </StyledMapWrapper>
        </>
    );
};

export default MapView;