import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    axios.get('/api/boards', api()).then(r => setBoards(r.data));
  }, []);

  const createBoard = async () => {
    if (!title.trim()) return;
    const { data } = await axios.post('/api/boards', { title }, api());
    setBoards([...boards, data]);
    setTitle('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/login');
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Ubuntu, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #ddd', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>Boards</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Welcome, {user.name}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '14px' }}>Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px', flex: '1' }}>
        {/* Create Board Section */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px', margin: '0 0 12px' }}>Create a new board</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              style={{ flex: '1', maxWidth: '400px' }}
              placeholder="Board name…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createBoard()}
            />
            <button onClick={createBoard} style={{ padding: '10px 20px', fontSize: '14px' }}>
              Create Board
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {boards.map(b =>
            <div
              key={b._id}
              onClick={() => nav(`/board/${b._id}`)}
              style={{
                border: '1px solid #ddd',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: '#fff'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = '#000';
                e.currentTarget.style.backgroundColor = '#f9f9f9';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>{b.title}</h2>
              <p style={{ margin: '0', fontSize: '13px', color: '#999' }}>{b.members?.length || 0} members</p>
            </div>
          )}
        </div>

        {boards.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: '#999' }}>
            <p style={{ fontSize: '16px' }}>No boards yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}