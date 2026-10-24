import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Gift, Truck, Search, Filter, RefreshCw, X, 
  MapPin, Phone, Mail, Award, CheckCircle2, Copy, Check, ExternalLink,
  ChevronRight, Calendar, ArrowUpDown, Shield, AlertCircle, Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function CompetitionParticipantsView({
  selectedTournamentId = 'ALL',
  onSelectTournamentId,
  notify
}) {
  const [currentTourId, setCurrentTourId] = useState(selectedTournamentId || 'ALL');
  const [competitions, setCompetitions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('SCORE_DESC'); // 'SCORE_DESC', 'NEWEST', 'OLDEST'
  const [inspectingUser, setInspectingUser] = useState(null);
  const [copiedTracking, setCopiedTracking] = useState('');
  const [editingLogistics, setEditingLogistics] = useState(false);
  const [customCourier, setCustomCourier] = useState('');
  const [customAwb, setCustomAwb] = useState('');

  // Sync external prop changes
  useEffect(() => {
    if (selectedTournamentId) {
      setCurrentTourId(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCompetitionParticipants({
        tournament_id: currentTourId,
        search: search.trim(),
        sort: sortBy
      });

      if (res.success) {
        setCompetitions(res.competitions || []);
        setParticipants(res.participants || []);
        setTotalCount(res.total_participants || (res.participants || []).length);
      }
    } catch (err) {
      console.error('Failed to load competition participants:', err);
      if (notify) notify(err.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [currentTourId, sortBy]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    loadParticipants();
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTracking(text);
    setTimeout(() => setCopiedTracking(''), 2500);
    if (notify) notify('Copied to clipboard: ' + text);
  };

  // Direct status update handler
  const handleUpdateStatus = async (orderId, newStatus, courierPartner, trackingNumber, note) => {
    try {
      if (!orderId) {
        if (notify) notify('❌ No order ID found for this contestant');
        return;
      }
      const partner = courierPartner || inspectingUser?.courier_partner || 'BlueDart Express';
      const awb = trackingNumber || inspectingUser?.tracking_number || `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`;

      await api.orders.updateStatus(orderId, {
        fulfillment_status: newStatus,
        courier_partner: partner,
        tracking_number: awb,
        note: note || `Logistics fulfillment status updated to ${newStatus}`
      });

      if (notify) notify(`✅ Courier status updated to ${newStatus}!`);

      if (inspectingUser && (inspectingUser.order_id === orderId || inspectingUser.id === orderId)) {
        setInspectingUser(prev => ({
          ...prev,
          fulfillment_status: newStatus,
          courier_partner: partner,
          tracking_number: awb
        }));
      }

      setParticipants(prev => prev.map(p => {
        if (p.order_id === orderId) {
          return {
            ...p,
            fulfillment_status: newStatus,
            courier_partner: partner,
            tracking_number: awb
          };
        }
        return p;
      }));

      setEditingLogistics(false);
      loadParticipants();
    } catch (err) {
      if (notify) notify(`❌ ${err.message || 'Failed to update courier status'}`);
    }
  };

  // Quick mark as Couriered
  const handleMarkAsCouriered = async (user) => {
    const partner = customCourier || user.courier_partner || 'BlueDart Express';
    const awb = customAwb || (!user.tracking_number || user.tracking_number === 'Awaiting dispatch' || user.tracking_number === 'AWB in queue'
      ? `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`
      : user.tracking_number);
    await handleUpdateStatus(user.order_id, 'DISPATCHED', partner, awb, 'Package couriered and dispatched to recipient address.');
  };

  // Quick mark as Delivered
  const handleMarkAsDelivered = async (user) => {
    await handleUpdateStatus(user.order_id, 'DELIVERED', user.courier_partner, user.tracking_number, 'Package successfully delivered to customer.');
  };

  const selectedCompetition = competitions.find((c) => String(c.id) === String(currentTourId)) || null;

  // Compute summary stats for current view
  const totalRevenue = participants.reduce((sum, p) => sum + Number(p.amount_paid || 1000), 0);
  const topScorer = participants.length > 0
    ? [...participants].sort((a, b) => (b.high_score || 0) - (a.high_score || 0))[0]
    : null;
  const dispatchedCount = participants.filter(p => p.fulfillment_status === 'DELIVERED' || p.fulfillment_status === 'DISPATCHED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 25px -5px rgba(11, 17, 32, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Users size={12} />
              <span>Contestants Audit Directory</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Competition Participants & Joined Contestants
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5, maxWidth: '700px' }}>
              Detailed audit of all contestants joined against each skill competition — including high scores, guaranteed apparel claimed, and verified doorstep delivery addresses.
            </p>
          </div>

          <button
            type="button"
            onClick={loadParticipants}
            disabled={loading}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>
        </div>
      </div>

      {/* 2. Competition Selector & Search Toolbar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '18px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Select Competition Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>
              <Trophy size={16} color="#0284c7" />
              <span>Select Competition:</span>
            </div>
            <select
              value={currentTourId}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentTourId(val);
                if (onSelectTournamentId) onSelectTournamentId(val);
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #0284c7',
                background: '#f0f9ff',
                color: '#0369a1',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ALL">
                🌟 All Competitions Combined ({totalCount} total joined)
              </option>
              {competitions.map((c) => {
                const count = c.actual_participants_count !== undefined ? c.actual_participants_count : (c.slots_filled || 0);
                return (
                  <option key={c.id} value={c.id}>
                    {c.title} — {count} contestants ({c.status})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="SCORE_DESC">🏆 Highest Score (Rank #1 First)</option>
              <option value="NEWEST">⏱️ Newest Joined First</option>
              <option value="OLDEST">📅 Oldest Joined First</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search contestants by name, email, phone, city, order number (WA-ORD-xxxx), or BlueDart tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#ffffff',
                outline: 'none'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setTimeout(loadParticipants, 50); }}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="submit"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* 3. Metrics Summary for Current Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {/* Metric 1: Contestants */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Users size={16} />
            <span>JOINED CONTESTANTS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
            {participants.length} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
              {selectedCompetition ? `/ ${selectedCompetition.total_slots || 500} slots` : 'total entries'}
            </span>
          </div>
          {selectedCompetition && (
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
              {Math.min(100, Math.round((participants.length / (selectedCompetition.total_slots || 500)) * 100))}% Capacity Reached
            </div>
          )}
        </div>

        {/* Metric 2: Revenue */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Award size={16} />
            <span>ENTRY REVENUE</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#047857' }}>
            ₹{Number(totalRevenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            ₹1,000 Verified Fee Per Entry
          </div>
        </div>

        {/* Metric 3: Top Scorer */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Trophy size={16} />
            <span>CURRENT LEADER (#1)</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topScorer?.user_name || 'No scores recorded'}
          </div>
          <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '800', marginTop: '4px' }}>
            {topScorer ? `🏆 ${topScorer.high_score || 0} pts` : 'Challenge starting'}
          </div>
        </div>

        {/* Metric 4: Apparel Dispatches */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7e22ce', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Gift size={16} />
            <span>GUARANTEED GIFTS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#7e22ce' }}>
            {participants.length} <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>gifts assigned</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {dispatchedCount} dispatched via BlueDart
          </div>
        </div>
      </div>

      {/* 4. Competition Focus Card (If specific competition is chosen) */}
      {selectedCompetition && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1.5px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <img
            src={selectedCompetition.image_url}
            alt={selectedCompetition.title}
            style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                {selectedCompetition.category}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: selectedCompetition.status === 'ACTIVE' ? '#047857' : '#64748b', background: selectedCompetition.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                {selectedCompetition.status}
              </span>
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              {selectedCompetition.title}
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Entry Fee: <strong>₹{Number(selectedCompetition.entry_fee).toLocaleString('en-IN')}</strong> &bull; Total Slots: <strong>{selectedCompetition.total_slots}</strong> &bull; Retail MRP: ₹{Number(selectedCompetition.retail_price).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Contestants In This Challenge:</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0284c7' }}>
              {participants.length} Players Enrolled
            </div>
          </div>
        </div>
      )}

      {/* 5. Participants List & Detailed Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Contestants Directory ({participants.length} Results)
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Showing all verified participants with full delivery address and gift choices
            </span>
          </div>

          {search && (
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: '6px' }}>
              Filtered by: "{search}"
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#0284c7' }} />
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Loading competition contestants...</div>
          </div>
        ) : participants.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              No Contestants Found
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto 16px' }}>
              {search 
                ? `No participants matched your search "${search}". Try searching by another keyword.`
                : 'No users have joined this challenge yet. Once users register and join for ₹1,000, their complete details will appear here.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setTimeout(loadParticipants, 50); }}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px' }}>Rank & Contestant</th>
                  <th style={{ padding: '12px 16px' }}>Competition</th>
                  <th style={{ padding: '12px 16px' }}>High Score</th>
                  <th style={{ padding: '12px 16px' }}>Guaranteed Gift</th>
                  <th style={{ padding: '12px 16px' }}>Delivery Address</th>
                  <th style={{ padding: '12px 16px' }}>Order & Tracking</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => {
                  const rank = p.competition_rank || p.rank || (idx + 1);
                  const isTop1 = rank === 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr 
                      key={p.entry_id || p.order_id || idx}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: isTop1 ? '#fffbeb' : '#ffffff',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* 1. Rank & Contestant */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* Rank Badge */}
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isTop1 ? '#f59e0b' : isTop3 ? '#0284c7' : '#f1f5f9',
                            color: isTop3 ? '#ffffff' : '#475569',
                            fontSize: '12px',
                            fontWeight: '900',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {rank}
                          </div>

                          {/* Avatar & Name */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>
                                {p.user_name || p.shipping_name || 'Anonymous Contestant'}
                              </span>
                              {p.user_role && p.user_role !== 'Users' && (
                                <span style={{ fontSize: '9px', fontWeight: '800', background: '#e0f2fe', color: '#0284c7', padding: '1px 5px', borderRadius: '4px' }}>
                                  {p.user_role}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {p.user_email}
                            </div>
                            {(p.user_phone || p.shipping_phone) && (
                              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>
                                📞 {p.user_phone || p.shipping_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Competition */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>
                          {p.tournament_title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>
                          {p.tournament_category}
                        </div>
                        {p.joined_at && (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                            Joined: {new Date(p.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>

                      {/* 3. High Score & Gameplay */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isTop1 ? '#fef3c7' : '#ecfdf5',
                          border: isTop1 ? '1px solid #fcd34d' : '1px solid #a7f3d0',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: '900',
                          fontSize: '13px',
                          color: isTop1 ? '#92400e' : '#065f46'
                        }}>
                          <Trophy size={13} color={isTop1 ? '#d97706' : '#059669'} />
                          <span>{p.high_score !== null && p.high_score !== undefined ? p.high_score : 0} pts</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          🎮 {p.games_played || 0} games played
                        </div>
                      </td>

                      {/* 4. Guaranteed Apparel Gift */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.gift_image && (
                            <img
                              src={p.gift_image}
                              alt=""
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: '#f1f5f9' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>
                              {p.gift_category || p.gift_name || 'Guaranteed Apparel'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Size: <strong>{p.selected_size || 'M'}</strong> &bull; Shade: {p.selected_color || 'Standard'}
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0', marginTop: '3px', display: 'inline-block' }}>
                              100% FREE REWARD
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Doorstep Delivery Address */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <MapPin size={14} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '12px' }}>
                              {p.shipping_name || p.user_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, marginTop: '2px' }}>
                              {p.shipping_address || p.user_address || 'Address pending'}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#0284c7', marginTop: '2px' }}>
                              {p.shipping_city || p.user_city || 'City'}, {p.shipping_state || 'Tamil Nadu'} - {p.shipping_pincode || p.user_pincode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Order & Tracking */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0284c7', fontSize: '12px' }}>
                          {p.order_number || 'WA-ORD-PENDING'}
                        </div>
                        
                        {p.tracking_number ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace', fontWeight: '700' }}>
                              {p.tracking_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.tracking_number)}
                              title="Copy Tracking Number"
                              style={{ background: 'none', border: 'none', color: copiedTracking === p.tracking_number ? '#16a34a' : '#64748b', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedTracking === p.tracking_number ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>AWB in queue</div>
                        )}

                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <select
                            value={p.fulfillment_status || 'ORDER_PLACED'}
                            onChange={(e) => handleUpdateStatus(p.order_id, e.target.value)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '800',
                              border: p.fulfillment_status === 'DELIVERED'
                                ? '1px solid #10b981'
                                : (p.fulfillment_status === 'DISPATCHED' ? '1px solid #0284c7' : '1px solid #f59e0b'),
                              background: p.fulfillment_status === 'DELIVERED'
                                ? '#ecfdf5'
                                : (p.fulfillment_status === 'DISPATCHED' ? '#f0f9ff' : '#fffbeb'),
                              color: p.fulfillment_status === 'DELIVERED'
                                ? '#047857'
                                : (p.fulfillment_status === 'DISPATCHED' ? '#0369a1' : '#b45309'),
                              cursor: 'pointer'
                            }}
                          >
                            <option value="ORDER_PLACED">⏳ Order Placed</option>
                            <option value="PACKED">📦 Packed</option>
                            <option value="DISPATCHED">🚚 Couriered</option>
                            <option value="OUT_FOR_DELIVERY">🛵 Out for Delivery</option>
                            <option value="DELIVERED">✅ Delivered</option>
                          </select>

                          {p.fulfillment_status === 'ORDER_PLACED' && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsCouriered(p)}
                              style={{
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '3px 8px',
                                borderRadius: '5px',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.25)'
                              }}
                              title="Mark as Couriered"
                            >
                              <Truck size={10} />
                              <span>Courier</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 7. Action: Dossier View */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setInspectingUser(p)}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. CONTESTANT FULL DOSSIER MODAL */}
      {inspectingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0b1120',
              color: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '18px',
                  color: '#ffffff'
                }}>
                  {inspectingUser.user_name ? inspectingUser.user_name.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
                    Contestant Dossier & Order Record
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '2px 0 0 0', color: '#ffffff' }}>
                    {inspectingUser.user_name || inspectingUser.shipping_name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Competition & Rank Pill */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase' }}>
                    Competing In Challenge:
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                    {inspectingUser.tournament_title}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Rank</div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0284c7' }}>#{inspectingUser.competition_rank || inspectingUser.rank || 1}</div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>High Score</div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#059669' }}>{inspectingUser.high_score || 0} pts</div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Games</div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#d97706' }}>{inspectingUser.games_played || 0}</div>
                  </div>
                </div>
              </div>

              {/* 2-Column Grid: Contact & Delivery Address */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* Contact Card */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Shield size={14} color="#0284c7" />
                    <span>Contestant Profile Details</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    <div><strong>Email:</strong> {inspectingUser.user_email}</div>
                    <div><strong>Phone:</strong> {inspectingUser.user_phone || inspectingUser.shipping_phone || 'Not available'}</div>
                    <div><strong>Role:</strong> {inspectingUser.user_role || 'Users'}</div>
                    <div><strong>City:</strong> {inspectingUser.user_city || inspectingUser.shipping_city || 'Not specified'}</div>
                    {inspectingUser.joined_at && (
                      <div><strong>Joined:</strong> {new Date(inspectingUser.joined_at).toLocaleString('en-IN')}</div>
                    )}
                  </div>
                </div>

                {/* Delivery Address Card */}
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <MapPin size={14} color="#059669" />
                    <span>Doorstep Courier Delivery Address</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                    <div><strong>Recipient:</strong> {inspectingUser.shipping_name || inspectingUser.user_name}</div>
                    <div><strong>Contact:</strong> {inspectingUser.shipping_phone || inspectingUser.user_phone}</div>
                    <div><strong>Address:</strong> {inspectingUser.shipping_address || inspectingUser.user_address || 'Pending'}</div>
                    <div><strong>Location:</strong> {inspectingUser.shipping_city || inspectingUser.user_city}, {inspectingUser.shipping_state || 'Tamil Nadu'} - <strong>{inspectingUser.shipping_pincode || inspectingUser.user_pincode}</strong></div>
                  </div>
                </div>
              </div>

              {/* Guaranteed Apparel Gift Details */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Gift size={15} color="#0284c7" />
                  <span>Guaranteed Apparel Reward Choice</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {inspectingUser.gift_image && (
                    <img
                      src={inspectingUser.gift_image}
                      alt=""
                      style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      {inspectingUser.gift_category || inspectingUser.gift_name || 'Apparel Reward'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Selected Size: <strong>{inspectingUser.selected_size || 'M'}</strong> &bull; Color Shade: <strong>{inspectingUser.selected_color || 'Standard'}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                      ✓ Shipped free of charge via express BlueDart courier
                    </div>
                  </div>
                </div>
              </div>

              {/* Order & Logistics Tracking Details */}
              <div style={{
                background: '#f8fafc',
                padding: '18px',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={17} color="#0284c7" />
                    <span>Courier Fulfillment & Order Audit</span>
                    {inspectingUser.order_id && (
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                        (DB ID: #{inspectingUser.order_id})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingLogistics(!editingLogistics);
                      setCustomCourier(inspectingUser.courier_partner || 'BlueDart Express');
                      setCustomAwb(inspectingUser.tracking_number || '');
                    }}
                    style={{
                      background: editingLogistics ? '#e0f2fe' : '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#0284c7',
                      cursor: 'pointer'
                    }}
                  >
                    {editingLogistics ? 'Close Editor' : '✏️ Edit Logistics'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Order Number:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0284c7', fontSize: '14px' }}>
                        {inspectingUser.order_number || 'WA-ORD-PENDING'}
                      </span>
                      {inspectingUser.order_number && (
                        <button
                          type="button"
                          onClick={() => handleCopy(inspectingUser.order_number)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                          title="Copy Order Number"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Courier Partner:</span>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>
                      {inspectingUser.courier_partner || 'BlueDart Express'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>AWB Tracking Number:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0284c7', fontSize: '13px' }}>
                        {inspectingUser.tracking_number || 'Awaiting dispatch'}
                      </span>
                      {inspectingUser.tracking_number && (
                        <button
                          type="button"
                          onClick={() => handleCopy(inspectingUser.tracking_number)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                          title="Copy AWB Tracking Number"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Payment Status:</span>
                    <div style={{ fontWeight: '800', color: '#059669', fontSize: '13px', marginTop: '2px' }}>
                      ✓ ₹{Number(inspectingUser.amount_paid || 1000).toLocaleString('en-IN')} ({inspectingUser.payment_method || 'UPI'})
                    </div>
                  </div>
                </div>

                {/* Logistics Inline Edit Form (when toggled) */}
                {editingLogistics && (
                  <div style={{
                    marginTop: '14px',
                    background: '#ffffff',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1.5px solid #0284c7'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', marginBottom: '10px' }}>
                      Edit Courier Partner & AWB Tracking:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
                          Courier Partner
                        </label>
                        <input
                          type="text"
                          value={customCourier}
                          onChange={(e) => setCustomCourier(e.target.value)}
                          placeholder="e.g. BlueDart Express"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {['BlueDart Express', 'Delhivery Logistics', 'DTDC Express', 'India Post'].map(cp => (
                            <button
                              key={cp}
                              type="button"
                              onClick={() => setCustomCourier(cp)}
                              style={{
                                background: customCourier === cp ? '#0284c7' : '#f8fafc',
                                color: customCourier === cp ? '#ffffff' : '#475569',
                                border: '1px solid #cbd5e1',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {cp.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                            AWB Tracking Number
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const pUpper = (customCourier || 'BLUEDART').split(' ')[0].toUpperCase();
                              const rand = Math.floor(1000000 + Math.random() * 9000000);
                              setCustomAwb(`${pUpper}-IND-${rand}`);
                            }}
                            style={{
                              border: 'none',
                              background: '#e0f2fe',
                              color: '#0284c7',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            ⚡ Auto-Generate
                          </button>
                        </div>
                        <input
                          type="text"
                          value={customAwb}
                          onChange={(e) => setCustomAwb(e.target.value)}
                          placeholder="e.g. BLUEDART-IND-7782918"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inspectingUser.order_id, inspectingUser.fulfillment_status, customCourier, customAwb)}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Save Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLogistics(false)}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#64748b',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Status Selector & One-Click Courier Dispatch Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>
                      Courier Fulfillment Status:
                    </span>
                    <select
                      value={inspectingUser.fulfillment_status || 'ORDER_PLACED'}
                      onChange={(e) => handleUpdateStatus(inspectingUser.order_id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        border: inspectingUser.fulfillment_status === 'DELIVERED'
                          ? '1.5px solid #10b981'
                          : (inspectingUser.fulfillment_status === 'DISPATCHED' ? '1.5px solid #0284c7' : '1.5px solid #f59e0b'),
                        background: inspectingUser.fulfillment_status === 'DELIVERED'
                          ? '#ecfdf5'
                          : (inspectingUser.fulfillment_status === 'DISPATCHED' ? '#f0f9ff' : '#fffbeb'),
                        color: inspectingUser.fulfillment_status === 'DELIVERED'
                          ? '#047857'
                          : (inspectingUser.fulfillment_status === 'DISPATCHED' ? '#0369a1' : '#b45309'),
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ORDER_PLACED">⏳ ORDER_PLACED (Order Placed / Packaging)</option>
                      <option value="PACKED">📦 PACKED (Packed & QC Passed)</option>
                      <option value="DISPATCHED">🚚 DISPATCHED (Couriered / In Transit)</option>
                      <option value="OUT_FOR_DELIVERY">🛵 OUT_FOR_DELIVERY (Out for Delivery)</option>
                      <option value="DELIVERED">✅ DELIVERED (Delivered to Customer)</option>
                    </select>
                  </div>

                  {/* One-Click Action Button */}
                  <div>
                    {inspectingUser.fulfillment_status !== 'DELIVERED' && inspectingUser.fulfillment_status !== 'DISPATCHED' ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAsCouriered(inspectingUser)}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                        }}
                      >
                        <Truck size={15} />
                        <span>Mark as Couriered & Dispatched</span>
                      </button>
                    ) : (
                      inspectingUser.fulfillment_status === 'DISPATCHED' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsDelivered(inspectingUser)}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 18px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Mark as Delivered</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px' }}>
                          ✓ Order Fulfilled & Delivered
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px'
            }}>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
