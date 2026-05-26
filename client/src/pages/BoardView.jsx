import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';

const COLS = ['todo', 'in-progress', 'done'];
const api = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export default function BoardView() {
  const { id } = useParams();
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const chatRef = useRef();

  useEffect(() => {
    axios.get(`/api/boards/${id}`, api()).then(r => {
      setBoard(r.data);
    });
    axios.get(`/api/tasks/${id}`, api()).then(r => setTasks(r.data));
    axios.get(`/api/messages/${id}`, api()).then(r => setMsgs(r.data));
    
    socket.emit('join-board', { boardId: id, userId: user.id, userName: user.name });
    
    socket.on('receive-message', (m) => setMsgs(p => [...p, m]));
    socket.on('task-added', (t) => setTasks(p => [...p, t]));
    socket.on('task-changed', (t) => setTasks(p => p.map(x => x._id === t._id ? t : x)));
    socket.on('members-online', (members) => setOnlineUsers(members));
    
    return () => { 
      socket.off('receive-message'); 
      socket.off('task-added'); 
      socket.off('task-changed');
      socket.off('members-online');
    };
  }, [id]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);

  const addTask = async () => {
    if (!input.trim()) return;
    const { data } = await axios.post('/api/tasks', { title: input, board: id }, api());
    socket.emit('task-created', { boardId: id, task: data });
    setInput('');
  };

  const moveTask = async (task, status) => {
    const { data } = await axios.patch(`/api/tasks/${task._id}`, { status }, api());
    socket.emit('task-updated', { boardId: id, task: data });
  };

  const sendMsg = () => {
    if (!chat.trim()) return;
    socket.emit('send-message', { boardId: id, text: chat, senderId: user.id, senderName: user.name });
    setChat('');
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const { data } = await axios.post(`/api/boards/${id}/invite`, { email: inviteEmail }, api());
      setBoard(data.board);
      setInviteEmail('');
      alert('Member invited successfully!');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to invite member');
    }
  };

  const isUserOnline = (userId) => onlineUsers.some(u => u.userId === userId);
  const colLabel = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };

  if (!board) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Ubuntu, sans-serif' }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Ubuntu, sans-serif', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #ddd', padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flex: '1' }}>
          <input
            style={{ flex: '1', maxWidth: '400px' }}
            placeholder="New task…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} style={{ padding: '8px 16px', fontSize: '14px' }}>Add Task</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowInvite(!showInvite)} style={{ padding: '8px 16px', fontSize: '14px' }}>
            Invite
          </button>
          <button onClick={() => nav('/dashboard')} style={{ padding: '8px 16px', fontSize: '14px', background: '#fff', border: '1px solid #ddd', color: '#000' }}>
            Back
          </button>
        </div>
      </div>

      {/* Invite Panel */}
      {showInvite && (
        <div style={{ borderBottom: '1px solid #ddd', padding: '16px 24px', backgroundColor: '#f9f9f9' }}>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '500px' }}>
            <input
              style={{ flex: '1' }}
              placeholder="Enter email to invite…"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && inviteMember()}
            />
            <button onClick={inviteMember} style={{ padding: '8px 16px', fontSize: '14px' }}>
              Invite
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', flex: '1', overflow: 'hidden' }}>
        {/* Kanban Board */}
        <div style={{ display: 'flex', gap: '20px', flex: '1', padding: '24px', overflowX: 'auto' }}>
          {COLS.map(col =>
            <div key={col} style={{ minWidth: '300px', borderLeft: '2px solid #000', paddingLeft: '16px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#999', marginBottom: '16px', margin: '0 0 16px' }}>
                {colLabel[col]}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.filter(t => t.status === col).map(t =>
                  <div key={t._id} style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#fff' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500' }}>{t.title}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {COLS.filter(c => c !== col).map(c =>
                        <button
                          key={c}
                          onClick={() => moveTask(t, c)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.target.style.backgroundColor = '#000';
                            e.target.style.color = '#fff';
                            e.target.style.borderColor = '#000';
                          }}
                          onMouseOut={e => {
                            e.target.style.backgroundColor = '#f0f0f0';
                            e.target.style.color = '#666';
                            e.target.style.borderColor = '#ddd';
                          }}
                        >
                          → {colLabel[c]}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '280px', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9', overflow: 'hidden' }}>
          {/* Members Section */}
          <div style={{ borderBottom: '1px solid #ddd' }}>
            <div style={{ padding: '16px', fontWeight: '700', fontSize: '13px', borderBottom: '1px solid #ddd' }}>MEMBERS</div>
            <div style={{ padding: '12px 16px', maxHeight: '150px', overflowY: 'auto' }}>
              {board.members.map(member => {
                const online = isUserOnline(member._id);
                const isOwner = board.owner._id === member._id;
                return (
                  <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: online ? '#000' : '#ccc'
                    }}></div>
                    <span style={{ flex: '1' }}>{member.name}</span>
                    {isOwner && <span style={{ fontSize: '11px', fontWeight: '500', color: '#666' }}>Owner</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Section */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0' }}>
            <div style={{ padding: '16px', fontWeight: '700', fontSize: '13px', borderBottom: '1px solid #ddd' }}>CHAT</div>
            <div
              ref={chatRef}
              style={{
                flex: '1',
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {msgs.map(m =>
                <div key={m._id} style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: '600' }}>{m.sender?.name}: </span>
                  <span style={{ color: '#666' }}>{m.text}</span>
                </div>
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #ddd', display: 'flex', gap: '8px' }}>
              <input
                style={{ flex: '1', fontSize: '13px' }}
                placeholder="Message…"
                value={chat}
                onChange={e => setChat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
              />
              <button onClick={sendMsg} style={{ padding: '6px 12px', fontSize: '13px' }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}