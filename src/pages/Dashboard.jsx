import React, { useState, useEffect } from 'react';
import { Mic, Plus, Trash2, LogOut, Wallet, ArrowDownCircle, ArrowUpCircle, Edit2 } from 'lucide-react';
import api from '../api';
import VoiceInput from '../components/VoiceInput';
import { worldCurrencies } from '../worldCurrencies';
import { Search, ChevronDown, Check } from 'lucide-react';

const Dashboard = () => {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newListName, setNewListName] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const [currency, setCurrency] = useState(user.preferredCurrency || 'USD');
  const [currencySymbol, setCurrencySymbol] = useState(user.preferredCurrencySymbol || '$');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState(user.preferredLanguage || 'en-US');
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', amount: 0, type: 'spent' });

  const voiceLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-SA', name: 'Arabic (SA)' },
    { code: 'tr-TR', name: 'Turkish (TR)' },
    { code: 'es-ES', name: 'Spanish (ES)' },
    { code: 'fr-FR', name: 'French (FR)' },
    { code: 'de-DE', name: 'German (DE)' }
  ];

  const filteredCurrencies = worldCurrencies.filter(c => 
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) || 
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );
  const currencies = [
    { symbol: '$', code: 'USD' },
    { symbol: '€', code: 'EUR' },
    { symbol: '£', code: 'GBP' },
    { symbol: '¥', code: 'JPY' },
    { symbol: 'SR', code: 'SAR' },
    { symbol: 'KD', code: 'KWD' }
    // {symbol :'', code:'TRY'}
  ];

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
        currency,
        currencySymbol,
        listId: selectedList._id
      });
      setTransactions([res.data, ...transactions]);
    } catch (err) {
      console.error('Error adding transaction', err);
    }
  };

  const handleCurrencyUpdate = async (code) => {
    const selected = worldCurrencies.find(c => c.code === code);
    try {
      await api.put('/auth/preferences', { 
        preferredCurrency: selected.code, 
        preferredCurrencySymbol: selected.symbol || code,
        preferredLanguage: voiceLanguage 
      });
      setCurrency(selected.code);
      setCurrencySymbol(selected.symbol || code);
      // Update local storage
      const updatedUser = { ...user, preferredCurrency: selected.code, preferredCurrencySymbol: selected.symbol || code, preferredLanguage: voiceLanguage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating currency', err);
    }
  };

  const handleLanguageUpdate = async (langCode) => {
    try {
      await api.put('/auth/preferences', { 
        preferredCurrency: currency, 
        preferredCurrencySymbol: currencySymbol,
        preferredLanguage: langCode 
      });
      setVoiceLanguage(langCode);
      // Update local storage
      const updatedUser = { ...user, preferredCurrency: currency, preferredCurrencySymbol: currencySymbol, preferredLanguage: langCode };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating language', err);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error deleting transaction', err);
    }
  };

  const handleEditStart = (t) => {
    setEditingTransactionId(t._id);
    setEditForm({ description: t.description, amount: t.amount, type: t.type });
  };

  const handleUpdateTransaction = async (id) => {
    try {
      const res = await api.put(`/transactions/${id}`, editForm);
      setTransactions(transactions.map(t => t._id === id ? res.data : t));
      setEditingTransactionId(null);
    } catch (err) {
      console.error('Error updating transaction', err);
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
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header className="flex-between-responsive" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontWeight: '800' }}>Hello, {user.firstname}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Keep track of your monthly spending</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Voice:</span>
            <select 
              value={voiceLanguage}
              onChange={(e) => handleLanguageUpdate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '500', outline: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {voiceLanguages.map(l => (
                <option key={l.code} value={l.code} style={{ background: '#1e293b' }}>{l.name}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <div 
              className="glass-card" 
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minWidth: '100px', justifyContent: 'space-between' }}
            >
              <span style={{ fontWeight: '700' }}>{currency}</span>
              <ChevronDown size={14} style={{ transform: isCurrencyOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>
            {/* ... currency dropdown remains same ... */}

            {isCurrencyOpen && (
              <div className="glass-card animate-fade-in" style={{ 
                position: 'absolute', 
                top: '120%', 
                right: 0, 
                width: '240px', 
                zIndex: 1000, 
                padding: '0.5rem',
                maxHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    placeholder="Search currency..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    autoFocus
                    style={{ 
                      width: '100%', 
                      padding: '0.6rem 0.6rem 0.6rem 2rem', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--glass-border)', 
                      borderRadius: '0.4rem', 
                      color: 'white',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {filteredCurrencies.map(c => (
                    <div 
                      key={c.code}
                      onClick={() => {
                        handleCurrencyUpdate(c.code);
                        setIsCurrencyOpen(false);
                        setCurrencySearch('');
                      }}
                      style={{ 
                        padding: '0.5rem 0.75rem', 
                        borderRadius: '0.3rem', 
                        cursor: 'pointer',
                        background: currency === c.code ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem'
                      }}
                      onMouseEnter={(e) => { if(currency !== c.code) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { if(currency !== c.code) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{c.code} - <span style={{ opacity: 0.7 }}>{c.name}</span></span>
                      {currency === c.code && <Check size={14} />}
                    </div>
                  ))}
                  {filteredCurrencies.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No currencies found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={logout} className="btn" style={{ background: 'var(--glass)', color: 'var(--text)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
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
            <h4>Total Balance ({currency})</h4>
            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{currencySymbol}{totalGot - totalSpent}</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpCircle size={14} /> {currencySymbol}{totalGot}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowDownCircle size={14} /> {currencySymbol}{totalSpent}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Transactions */}
        <div className="glass-card" style={{ minHeight: '600px' }}>
          {selectedList ? (
            <>
              <div className="flex-between-responsive" style={{ marginBottom: '2rem' }}>
                <h2>{selectedList.name}</h2>
                <VoiceInput onResult={handleVoiceTransaction} lang={voiceLanguage} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {transactions.map(t => (
                  <div key={t._id} style={{ padding: '1rem', background: 'var(--glass)', borderRadius: '0.5rem' }}>
                    {editingTransactionId === t._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            style={{ flex: 2, padding: '0.5rem', borderRadius: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                          <input 
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: parseInt(e.target.value) || 0 })}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => setEditForm({ ...editForm, type: 'got' })}
                              className="btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: editForm.type === 'got' ? 'var(--success)' : 'var(--glass)' }}
                            >Gain</button>
                            <button 
                              onClick={() => setEditForm({ ...editForm, type: 'spent' })}
                              className="btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: editForm.type === 'spent' ? 'var(--danger)' : 'var(--glass)' }}
                            >Spent</button>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setEditingTransactionId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                            <button onClick={() => handleUpdateTransaction(t._id)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Save</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '600' }}>{t.description}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', color: t.type === 'spent' ? 'var(--danger)' : 'var(--success)' }}>
                              {t.type === 'spent' ? '-' : '+'}{t.currencySymbol || currencySymbol}{t.amount}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditStart(t)}
                              className="btn-icon"
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', transition: '0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => deleteTransaction(t._id)}
                              className="btn-icon"
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', transition: '0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
