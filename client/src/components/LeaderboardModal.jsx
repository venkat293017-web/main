import React, { useState, useEffect } from 'react';
import { X, Trophy, Award, Medal, Crown, Flame, Gamepad2 } from 'lucide-react';
import { api } from '../services/api';

export default function LeaderboardModal({ tournament, tournaments = [], onClose, onPlayTournament }) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    tournament?.id || tournaments[0]?.id || null
  );
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedTournamentId) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.tournaments.getLeaderboard(selectedTournamentId);
        if (res.success) {
          setLeaderboard(res.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedTournamentId]);

  const currentTour = tournaments.find((t) => t.id === selectedTournamentId) || tournament;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '640px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0b1120',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                Official Public Leaderboard
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Live real-time skill standings verified by Nokia Snake II backend
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#ffffff', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tournament Selector Pill Tabs */}
        {tournaments.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            overflowX: 'auto'
          }}>
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTournamentId(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: selectedTournamentId === t.id ? '800' : '600',
                  background: selectedTournamentId === t.id ? '#0284c7' : '#ffffff',
                  color: selectedTournamentId === t.id ? '#ffffff' : '#475569',
                  border: selectedTournamentId === t.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.title.split(' ')[0]} ({t.category.split(' ')[0]})
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Tournament Banner Strip */}
          {currentTour && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#15803d', fontWeight: '800', textTransform: 'uppercase' }}>
                  Grand Prize Trophy:
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  {currentTour.title}
                </div>
              </div>

              {currentTour.status === 'CONCLUDED' ? (
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px' }}>
                  CONTEST ENDED • WINNER REWARDED
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onPlayTournament) onPlayTournament(currentTour);
                  }}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Gamepad2 size={14} />
                  <span>Enter & Play</span>
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
              Fetching latest live scores...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
              No scores recorded yet. Be the first to join and top the board!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Rank</th>
                    <th style={{ padding: '10px' }}>Player Name</th>
                    <th style={{ padding: '10px' }}>Location</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Games</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>High Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isFirst = index === 0;
                    const isSecond = index === 1;
                    const isThird = index === 2;

                    return (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isFirst ? '#fefce8' : '#ffffff'
                        }}
                      >
                        <td style={{ padding: '12px 10px', fontWeight: '800' }}>
                          {isFirst ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309' }}>
                              <Crown size={16} fill="#f59e0b" color="#b45309" />
                              <span>#1</span>
                            </span>
                          ) : isSecond ? (
                            <span style={{ color: '#475569' }}>🥈 #2</span>
                          ) : isThird ? (
                            <span style={{ color: '#92400e' }}>🥉 #3</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>#{index + 1}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: isFirst ? '800' : '600', color: '#0f172a' }}>
                          {entry.player_name}
                          {isFirst && (
                            <span style={{
                              marginLeft: '6px',
                              fontSize: '10px',
                              fontWeight: '800',
                              color: '#92400e',
                              background: '#fef3c7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              CHAMPION 👑
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b' }}>
                          {entry.city || 'India'}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b' }}>
                          {entry.games_played || 1}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '900', color: isFirst ? '#0284c7' : '#0f172a', fontSize: '15px', fontFamily: 'monospace' }}>
                          {entry.high_score} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
