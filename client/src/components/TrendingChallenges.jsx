import React, { useState, useEffect } from 'react';
import { 
  Trophy, Clock, Users, ArrowRight, ShieldCheck, Flame, 
  Sparkles, CheckCircle2, Gift, Gamepad2, Calendar
} from 'lucide-react';

function CountdownTimer({ endTime, variant = 'live' }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const pad = (n) => String(n).padStart(2, '0');
  const isUpcoming = variant === 'upcoming';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      fontWeight: '700',
      color: isUpcoming ? '#7c3aed' : '#0284c7',
      background: isUpcoming ? '#f5f3ff' : '#f0f9ff',
      border: isUpcoming ? '1px solid #ddd6fe' : '1px solid #bae6fd',
      padding: '4px 10px',
      borderRadius: '8px'
    }}>
      <Clock size={13} color={isUpcoming ? '#7c3aed' : '#0284c7'} />
      <span>{timeLeft.days}d : {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s</span>
    </div>
  );
}

export default function TrendingChallenges({ 
  tournaments = [], 
  onSelectTournament, 
  selectedCategory, 
  onSelectCategory,
  onOpenLeaderboard,
  onOpenSnakeGame
}) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'LIVE', 'UPCOMING', 'CONCLUDED'

  // Hide deactivated / inactive challenges from public home page
  const filteredTournaments = tournaments.filter((t) => t.status !== 'INACTIVE');

  const isConcluded = (t) => {
    if (t.status === 'CONCLUDED') return true;
    return Boolean(t.winner_id) || (t.end_time && new Date(t.end_time).getTime() <= Date.now());
  };

  const isUpcoming = (t) => {
    if (isConcluded(t) || t.status === 'INACTIVE') return false;
    return t.start_time && new Date(t.start_time).getTime() > Date.now();
  };

  const isLive = (t) => {
    if (isConcluded(t) || t.status !== 'ACTIVE') return false;
    return !t.start_time || new Date(t.start_time).getTime() <= Date.now();
  };

  const liveList = filteredTournaments.filter(isLive);
  const upcomingList = filteredTournaments.filter(isUpcoming);
  const concludedList = filteredTournaments.filter(isConcluded);
  const activeChallengesList = filteredTournaments.filter((t) => !isConcluded(t));

  // By default (or in 'ALL'), show ONLY active ongoing challenges (Live + Upcoming).
  // Concluded challenges will ONLY be displayed when user explicitly clicks the 'CONCLUDED' filter!
  let displayedTournaments = activeChallengesList;
  if (activeFilter === 'LIVE') {
    displayedTournaments = liveList;
  } else if (activeFilter === 'UPCOMING') {
    displayedTournaments = upcomingList;
  } else if (activeFilter === 'CONCLUDED') {
    displayedTournaments = concludedList;
  }

  return (
    <section id="tournaments-section" style={{ padding: '3rem 0' }}>
      <div className="container">
        {/* Section Header with Dark Themed Container */}
        <div style={{
          background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 100%)',
          borderRadius: '24px',
          padding: '24px 32px',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 20px 30px -10px rgba(11, 17, 32, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Title, Live Pulse & Live Leaderboard Action */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.5px'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444'
                  }} />
                  LIVE ARENA & UPCOMING
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
                  Tournaments & Challenges
                </h2>
                <Flame size={22} color="#f43f5e" />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '13.5px', marginTop: '6px', lineHeight: 1.5 }}>
                Compete in live skill challenges or pre-register for upcoming tournaments. Win grand prizes with 100% verified guaranteed gifts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenLeaderboard && onOpenLeaderboard()}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.35)';
              }}
            >
              <Trophy size={16} />
              <span>Live Leaderboards</span>
            </button>
          </div>

          {/* Quick Filter Tabs: All, Live Now, Upcoming Challenges, Concluded */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
              Filter:
            </span>

            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              style={{
                background: activeFilter === 'ALL' ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                color: activeFilter === 'ALL' ? '#0f172a' : '#cbd5e1',
                border: activeFilter === 'ALL' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>All Challenges</span>
              <span style={{
                background: activeFilter === 'ALL' ? '#0284c7' : 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: '900'
              }}>
                {activeChallengesList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('LIVE')}
              style={{
                background: activeFilter === 'LIVE' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: activeFilter === 'LIVE' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', boxShadow: '0 0 6px #ef4444' }} />
              <span>Live Now</span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: '900'
              }}>
                {liveList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('UPCOMING')}
              style={{
                background: activeFilter === 'UPCOMING' ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: activeFilter === 'UPCOMING' ? '1px solid #c4b5fd' : '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>⏳ Upcoming Challenges</span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: '900'
              }}>
                {upcomingList.length}
              </span>
            </button>

            {concludedList.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('CONCLUDED')}
                style={{
                  background: activeFilter === 'CONCLUDED' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: activeFilter === 'CONCLUDED' ? '1px solid #fcd34d' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: activeFilter === 'CONCLUDED' ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none'
                }}
              >
                <span>👑 Concluded</span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontWeight: '900'
                }}>
                  {concludedList.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* CONCLUDED SPOTLIGHT CALLOUT (Displayed only when user clicks CONCLUDED filter tab) */}
        {activeFilter === 'CONCLUDED' && (
          <div style={{
            background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
            borderRadius: '18px',
            padding: '16px 24px',
            color: '#ffffff',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            boxShadow: '0 10px 25px -5px rgba(180, 83, 9, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                👑
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Concluded Challenges & Declared Champions</span>
                  <span style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: '900',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}>
                    {concludedList.length} Concluded
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#fde68a', marginTop: '2px' }}>
                  These challenges have officially concluded. Click any challenge to view the winner profile, winning score, and final standings!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              style={{
                background: '#ffffff',
                color: '#78350f',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>← View Active Challenges</span>
            </button>
          </div>
        )}

        {/* UPCOMING SPOTLIGHT BANNER (Displayed when upcoming challenges exist and user is viewing ALL or UPCOMING) */}
        {upcomingList.length > 0 && activeFilter !== 'LIVE' && activeFilter !== 'CONCLUDED' && (
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: '18px',
            padding: '18px 24px',
            color: '#ffffff',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            border: '1px solid rgba(165, 180, 252, 0.35)',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                ⏳
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Upcoming Mega Challenges Available</span>
                  <span style={{
                    background: '#818cf8',
                    color: '#0f172a',
                    fontSize: '10.5px',
                    fontWeight: '900',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {upcomingList.length} Upcoming
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#c7d2fe', marginTop: '3px', lineHeight: 1.4 }}>
                  Pre-register early to secure guaranteed luxury apparel. Gameplay unlocks automatically when contest launches!
                </div>
              </div>
            </div>

            {activeFilter !== 'UPCOMING' && (
              <button
                type="button"
                onClick={() => setActiveFilter('UPCOMING')}
                style={{
                  background: '#ffffff',
                  color: '#312e81',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>View Upcoming Challenges</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}

        {/* Tournaments Grid */}
        {displayedTournaments.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1'
          }}>
            <Trophy size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {activeFilter === 'UPCOMING' 
                ? 'No Upcoming Challenges Right Now' 
                : activeFilter === 'LIVE' 
                ? 'No Live Challenges Currently Open' 
                : activeFilter === 'CONCLUDED'
                ? 'No Concluded Challenges Yet'
                : 'No Challenges Found'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
              {activeFilter === 'UPCOMING' 
                ? 'Stay tuned! New skill challenges will be scheduled soon.' 
                : activeFilter === 'CONCLUDED'
                ? 'Check back when active contests conclude to view declared champions.'
                : 'Check back shortly or explore our guaranteed reward items.'}
            </p>
            {activeFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                style={{
                  marginTop: '14px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                View All Challenges
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {displayedTournaments.map((tournament) => {
              const tournamentIsUpcoming = isUpcoming(tournament);
              const tournamentIsLive = isLive(tournament);
              const isConcluded = tournament.status === 'CONCLUDED';
              const isInactive = tournament.status === 'INACTIVE';
              const hasJoined = tournament.my_score !== null && tournament.my_score !== undefined;
              const slotsFilled = tournament.slots_filled || 0;
              const totalSlots = tournament.total_slots || 500;
              const fillPercentage = Math.min(100, Math.round((slotsFilled / totalSlots) * 100));

              return (
                <div
                  key={tournament.id}
                  onClick={() => onSelectTournament(tournament)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: tournamentIsUpcoming ? '1.5px solid #c4b5fd' : '1px solid #e2e8f0',
                    boxShadow: tournamentIsUpcoming ? '0 6px 18px rgba(124, 58, 237, 0.08)' : '0 4px 14px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = tournamentIsUpcoming 
                      ? '0 16px 32px -8px rgba(124, 58, 237, 0.2)' 
                      : '0 16px 30px -8px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = tournamentIsUpcoming 
                      ? '0 6px 18px rgba(124, 58, 237, 0.08)' 
                      : '0 4px 14px rgba(0,0,0,0.05)';
                  }}
                >
                  {/* Image Container with Badges */}
                  <div style={{ position: 'relative', height: '230px', background: '#0b1120' }}>
                    <img
                      src={tournament.image_url}
                      alt={tournament.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />

                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      background: isConcluded 
                        ? 'rgba(15, 23, 42, 0.9)' 
                        : isInactive
                        ? 'rgba(220, 38, 38, 0.92)'
                        : tournamentIsUpcoming
                        ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                        : '#0284c7',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {tournamentIsUpcoming && <Clock size={12} />}
                      <span>
                        {isConcluded 
                          ? 'Winner Declared • Contest Ended' 
                          : isInactive 
                          ? 'Paused • Deactivated' 
                          : tournamentIsUpcoming 
                          ? 'Upcoming Challenge' 
                          : (tournament.badge_text || 'Live Arena Contest')}
                      </span>
                    </div>

                    {/* User Submitted High Score Badge on Card */}
                    {tournament.my_score !== null && tournament.my_score !== undefined && (
                      <div style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'rgba(5, 150, 105, 0.95)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '900',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        zIndex: 2
                      }}>
                        <Trophy size={12} />
                        <span>Score: {tournament.my_score} pts</span>
                      </div>
                    )}

                    {/* Official Unit Tag */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '14px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      100% Brand Sealed Unit
                    </div>
                  </div>

                  {/* Content Container */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Category & Rating */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: tournamentIsUpcoming ? '#7c3aed' : '#0284c7', textTransform: 'uppercase' }}>
                        {tournament.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                        <span>★</span>
                        <span>{parseFloat(tournament.rating || 5.0).toFixed(1)}</span>
                        <span style={{ color: '#94a3b8', fontWeight: '500' }}>({tournament.ratings_count || 1})</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '800',
                      color: '#0f172a',
                      marginBottom: '10px',
                      lineHeight: 1.3
                    }}>
                      {tournament.title}
                    </h3>

                    {/* UPCOMING LAUNCH DATE CALLOUT */}
                    {tournamentIsUpcoming && tournament.start_time && (
                      <div style={{
                        background: '#f5f3ff',
                        border: '1px solid #ddd6fe',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#6d28d9'
                      }}>
                        <Calendar size={13} color="#7c3aed" />
                        <span>Starts on {new Date(tournament.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}

                    {/* User's High Score Callout against this Challenge */}
                    {tournament.my_score !== null && tournament.my_score !== undefined && (
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                        border: '1.5px solid #86efac',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Trophy size={16} color="#059669" />
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>
                              Your Score in Challenge
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#065f46' }}>
                              {tournament.my_score} pts {tournament.my_rank ? `• Rank #${tournament.my_rank}` : ''}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#065f46',
                          background: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0'
                        }}>
                          {tournament.my_games_played ? `${tournament.my_games_played} played` : 'Enrolled'}
                        </span>
                      </div>
                    )}

                    {/* Pricing */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                        ₹{Number(tournament.entry_fee).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{Number(tournament.retail_price).toLocaleString('en-IN')}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#059669',
                        background: '#ecfdf5',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        -99% VALUE
                      </span>
                    </div>

                    {/* Slots Progress Bar */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontWeight: '600' }}>
                          Slots Filled: <strong style={{ color: '#0f172a' }}>{slotsFilled} / {totalSlots}</strong>
                        </span>
                        <span style={{ color: tournamentIsUpcoming ? '#7c3aed' : '#0284c7', fontWeight: '700' }}>
                          {fillPercentage}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${fillPercentage}%`,
                          height: '100%',
                          background: tournamentIsUpcoming
                            ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
                            : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                          borderRadius: '9999px'
                        }} />
                      </div>
                    </div>

                    {/* Guaranteed Reward Highlight */}
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <Gift size={16} color="#059669" />
                      <div style={{ fontSize: '11px', color: '#334155' }}>
                        Includes <strong>100% Guaranteed Gift</strong> shipped to your doorstep
                      </div>
                    </div>

                    {/* Concluded Winner Announcement OR Countdown */}
                    {isConcluded ? (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #fcd34d',
                        borderRadius: '10px',
                        padding: '10px',
                        textAlign: 'center',
                        marginBottom: '14px'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>
                          Grand Prize Winner 👑
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>
                          {tournament.winner_name || 'Rahul Sharma (Declared Champion 👑)'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                          Winning High Score: <strong>{tournament.winner_score || 1420} pts</strong>
                        </div>
                      </div>
                    ) : tournamentIsUpcoming ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11.5px', color: '#7c3aed', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={13} />
                          <span>Contest Starts In:</span>
                        </span>
                        <CountdownTimer endTime={tournament.start_time} variant="upcoming" />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          Contest Deadline:
                        </span>
                        <CountdownTimer endTime={tournament.end_time} />
                      </div>
                    )}

                    {/* Action Button */}
                    <div style={{ marginTop: 'auto' }}>
                      <button
                        onClick={(e) => {
                          if (isInactive) {
                            e.stopPropagation();
                            return;
                          }
                          if (tournamentIsUpcoming) {
                            // If upcoming, card opens modal for pre-registration
                            return;
                          }
                          if (hasJoined && onOpenSnakeGame) {
                            e.stopPropagation();
                            onOpenSnakeGame(tournament.id);
                          }
                        }}
                        style={{
                          width: '100%',
                          background: isConcluded 
                            ? '#f1f5f9' 
                            : isInactive
                            ? '#f8fafc'
                            : tournamentIsUpcoming
                            ? (hasJoined ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)')
                            : hasJoined
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: isConcluded ? '#475569' : isInactive ? '#94a3b8' : '#ffffff',
                          fontWeight: '800',
                          fontSize: '14px',
                          padding: '12px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: isConcluded || isInactive
                            ? 'none' 
                            : tournamentIsUpcoming
                            ? (hasJoined ? '0 4px 14px rgba(16, 185, 129, 0.35)' : '0 4px 14px rgba(124, 58, 237, 0.35)')
                            : hasJoined
                            ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                            : '0 4px 12px rgba(2, 132, 199, 0.3)',
                          border: isInactive ? '1px solid #e2e8f0' : 'none',
                          cursor: isInactive ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isConcluded ? (
                          <>
                            <span>View Final Leaderboard</span>
                            <ArrowRight size={16} />
                          </>
                        ) : isInactive ? (
                          <span>Challenge Temporarily Inactive</span>
                        ) : tournamentIsUpcoming ? (
                          hasJoined ? (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Pre-Registered ✅ • Starts Soon</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              <span>Pre-Register Now (₹1,000)</span>
                              <ArrowRight size={16} />
                            </>
                          )
                        ) : hasJoined ? (
                          <>
                            <Gamepad2 size={18} />
                            <span>Play & Improve Score</span>
                          </>
                        ) : (
                          <>
                            <span>Join Challenge (₹1,000)</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
