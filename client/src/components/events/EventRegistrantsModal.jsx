import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Users, Mail, Phone, Calendar, Loader, Download, Search } from 'lucide-react';
import { organizerAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventRegistrantsModal = ({ isOpen, onClose, event }) => {
  const [loading, setLoading] = useState(false);
  const [registrants, setRegistrants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isOpen && event) {
      fetchRegistrants();
    }
  }, [isOpen, event]);

  const fetchRegistrants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await organizerAPI.getEventRegistrants(event._id, params);
      setRegistrants(response.data || response || []);
    } catch (error) {
      toast.error('Failed to load registrants');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await organizerAPI.exportRegistrants(event._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title}-registrants.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Registrants exported successfully!');
    } catch (error) {
      toast.error('Failed to export registrants');
    }
  };

  if (!isOpen || !event) return null;

  const filteredRegistrants = registrants.filter(reg => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reg.userSnapshot?.name?.toLowerCase().includes(searchLower) ||
      reg.userSnapshot?.email?.toLowerCase().includes(searchLower) ||
      reg.userSnapshot?.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <div>
            <h2>Event Registrants</h2>
            <EventTitle>{event.title}</EventTitle>
          </div>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Toolbar>
          <SearchBox>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>

          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchRegistrants();
            }}
          >
            <option value="all">All Status</option>
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </FilterSelect>

          <ExportButton onClick={handleExport}>
            <Download size={18} />
            Export CSV
          </ExportButton>
        </Toolbar>

        <Stats>
          <StatItem>
            <Users size={20} />
            <div>
              <StatValue>{filteredRegistrants.length}</StatValue>
              <StatLabel>Total Registrants</StatLabel>
            </div>
          </StatItem>
        </Stats>

        <Content>
          {loading ? (
            <LoadingState>
              <Loader className="spin" size={48} />
              <p>Loading registrants...</p>
            </LoadingState>
          ) : filteredRegistrants.length === 0 ? (
            <EmptyState>
              <Users size={64} />
              <h3>No Registrants Found</h3>
              <p>
                {searchTerm
                  ? 'No registrants match your search'
                  : 'No one has registered for this event yet'}
              </p>
            </EmptyState>
          ) : (
            <RegistrantsList>
              {filteredRegistrants.map((registrant) => (
                <RegistrantCard key={registrant._id}>
                  <RegistrantHeader>
                    <RegistrantName>
                      {registrant.userSnapshot?.name || 'Unknown'}
                    </RegistrantName>
                    <StatusBadge $status={registrant.status}>
                      {registrant.status}
                    </StatusBadge>
                  </RegistrantHeader>

                  <RegistrantInfo>
                    <InfoItem>
                      <Mail size={16} />
                      <span>{registrant.userSnapshot?.email || 'N/A'}</span>
                    </InfoItem>
                    {registrant.userSnapshot?.phone && (
                      <InfoItem>
                        <Phone size={16} />
                        <span>{registrant.userSnapshot.phone}</span>
                      </InfoItem>
                    )}
                    <InfoItem>
                      <Calendar size={16} />
                      <span>
                        Registered: {format(new Date(registrant.registeredAt), 'MMM dd, yyyy')}
                      </span>
                    </InfoItem>
                  </RegistrantInfo>

                  {/* Display custom fields if any */}
                  {registrant.customFields && Object.keys(registrant.customFields).length > 0 && (
                    <CustomFields>
                      <CustomFieldsTitle>Additional Information</CustomFieldsTitle>
                      {Object.entries(registrant.customFields).map(([key, value]) => (
                        <CustomFieldItem key={key}>
                          <CustomFieldLabel>
                            {event.registrationFields?.find(f => f.fieldName === key)?.label || key}:
                          </CustomFieldLabel>
                          <CustomFieldValue>
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                          </CustomFieldValue>
                        </CustomFieldItem>
                      ))}
                    </CustomFields>
                  )}
                </RegistrantCard>
              ))}
            </RegistrantsList>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: start;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }
`;

const EventTitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const Toolbar = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;

  svg {
    color: #9ca3af;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.875rem;
  }
`;

const FilterSelect = styled.select`
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4F46E5;
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

const Stats = styled.div`
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: #4F46E5;
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .spin {
    color: #4F46E5;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  p {
    margin-top: 1rem;
    color: #6b7280;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  svg {
    color: #cbd5e1;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: #64748b;
    margin: 0;
  }
`;

const RegistrantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RegistrantCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const RegistrantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const RegistrantName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  
  ${props => {
    switch (props.$status) {
      case 'registered':
        return 'background: #dbeafe; color: #1e40af;';
      case 'attended':
        return 'background: #dcfce7; color: #166534;';
      case 'cancelled':
        return 'background: #fee2e2; color: #991b1b;';
      case 'no-show':
        return 'background: #fef3c7; color: #92400e;';
      default:
        return 'background: #f3f4f6; color: #4b5563;';
    }
  }}
`;

const RegistrantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;

  svg {
    flex-shrink: 0;
    color: #9ca3af;
  }
`;

const CustomFields = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const CustomFieldsTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
`;

const CustomFieldItem = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const CustomFieldLabel = styled.span`
  font-weight: 600;
  color: #6b7280;
`;

const CustomFieldValue = styled.span`
  color: #111827;
`;

export default EventRegistrantsModal;
