import React, { useState, useEffect } from 'react';
import { Mic, Plus, Trash2, LogOut, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import api from '../api';
import VoiceInput from '../components/VoiceInput';

const Dashboard = () => {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newListName, setNewListName] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchTransactions(selectedList._id);
    }
  }, [selectedList]);

  const fetchLists = async () => {
    try {
      const res = await api.get('/lists');
      setLists(res.data);
      if (res.data.length > 0 && !selectedList) {
        setSelectedList(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching lists', err);
    }
  };

  const fetchTransactions = async (listId) => {
    try {
      const res = await api.get(`/transactions/${listId}`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching transactions', err);
    }
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const res = await api.post('/lists', { name: newListName });
      setLists([res.data, ...lists]);
      setNewListName('');
      setSelectedList(res.data);
    } catch (err) {
      console.error('Error creating list', err);
    }
  };

  const deleteList = async (id) => {
    try {
      await api.delete(`/lists/${id}`);
      const updatedLists = lists.filter(l => l._id !== id);
      setLists(updatedLists);
      if (selectedList?._id === id) {
        setSelectedList(updatedLists[0] || null);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error deleting list', err);
    }
  };

  const handleVoiceTransaction = async (data) => {
    if (!selectedList) return;
    try {
      const res = await api.post('/transactions', {
        ...data,
        listId: selectedList._id
      });
      setTransactions([res.data, ...transactions]);
    } catch (err) {
      console.error('Error adding transaction', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const totalSpent = transactions.filter(t => t.type === 'spent').reduce((acc, t) => acc + t.amount, 0);
  const totalGot = transactions.filter(t => t.type === 'got').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Hello, {user.firstname}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Keep track of your monthly spending</p>
        </div>
        <button onClick={logout} className="btn" style={{ background: 'var(--glass)', color: 'var(--text)' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left Column - Lists */}
        <div>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={20} color="var(--primary)" /> Your Lists
            </h3>
            <form onSubmit={createList} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                placeholder="New List Name..." 
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white' }}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <button size="icon" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                <Plus size={20} />
              </button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lists.map(list => (
                <div 
                  key={list._id} 
                  onClick={() => setSelectedList(list)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    background: selectedList?._id === list._id ? 'var(--primary)' : 'var(--glass)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: '0.2s'
                  }}
                >
                  <span>{list.name}</span>
                  <Trash2 size={16} onClick={(e) => { e.stopPropagation(); deleteList(list._id); }} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h4>Total Balance</h4>
            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>${totalGot - totalSpent}</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpCircle size={14} /> ${totalGot}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowDownCircle size={14} /> ${totalSpent}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Transactions */}
        <div className="glass-card" style={{ minHeight: '600px' }}>
          {selectedList ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>{selectedList.name}</h2>
                <VoiceInput onResult={handleVoiceTransaction} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {transactions.map(t => (
                  <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--glass)', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{t.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontWeight: '700', color: t.type === 'spent' ? 'var(--danger)' : 'var(--success)' }}>
                      {t.type === 'spent' ? '-' : '+'}${t.amount}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
                    No transactions yet. Click the mic and say "I spent 10 dollars"
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Select or create a list to start
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
