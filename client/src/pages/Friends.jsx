import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { friendsAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Wrapper = styled.div`
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
`;

const Card = styled.div`
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 0.75rem 1rem; font-weight: 700; border-bottom: 1px solid #f1f5f9;
`;

const Item = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #f8fafc;
`;

const Actions = styled.div`
  display: flex; gap: 0.5rem;
  button { border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 0.25rem 0.5rem; }
`;

const FriendsPage = () => {
  const [data, setData] = useState({ pending: [], sent: [], friends: [] });
  const navigate = useNavigate();

  const refresh = async () => {
    const { data } = await friendsAPI.getAll();
    setData(data);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <Wrapper>
      <Card>
        <CardHeader>Pending Requests</CardHeader>
        {(data.pending || []).map(req => (
          <Item key={req._id}>
            <div>
              <div style={{ fontWeight: 600 }}>{req.requester?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{req.requester?.email}</div>
            </div>
            <Actions>
              <button onClick={async () => { await friendsAPI.respond(req._id, 'accept'); refresh(); }}>Accept</button>
              <button onClick={async () => { await friendsAPI.respond(req._id, 'reject'); refresh(); }}>Reject</button>
            </Actions>
          </Item>
        ))}
      </Card>
      <Card>
        <CardHeader>Sent Requests</CardHeader>
        {(data.sent || []).map(req => (
          <Item key={req._id}>
            <div>
              <div style={{ fontWeight: 600 }}>{req.recipient?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{req.recipient?.email}</div>
            </div>
          </Item>
        ))}
      </Card>
      <Card>
        <CardHeader>Friends</CardHeader>
        {(data.friends || []).map(f => {
          const me = f.requester?._id === f.recipient?._id ? f.requester : null; // fallback, unused
          const other = f.requester?._id === f.recipient?._id ? f.recipient : (f.requester?._id === (window?.CURRENT_USER_ID || '') ? f.recipient : f.requester);
          return (
            <Item key={f._id}>
              <div>
                <div style={{ fontWeight: 600 }}>{other?.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{other?.email}</div>
              </div>
              <Actions>
                <button onClick={() => navigate(`/messages?userId=${other?._id}`)}>Message</button>
              </Actions>
            </Item>
          );
        })}
      </Card>
    </Wrapper>
  );
};

export default FriendsPage;


