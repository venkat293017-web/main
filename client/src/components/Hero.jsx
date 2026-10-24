import React from 'react';
import { 
  Trophy, Gift, ShieldCheck, Truck, CheckCircle2, ArrowRight, 
  Gamepad2, Sparkles, Heart 
} from 'lucide-react';

export default function Hero({ onBrowseTournaments, featuredTournament, onSelectTournament }) {
  return (
    <section style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
      <div className="container">
        {/* Main Hero Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
          marginBottom: '3rem'
        }}>
          {/* Left Text Column */}
          <div style={{ textAlign: 'left' }}>
            {/* Top Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#0284c7',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              <span style={{ color: '#f59e0b' }}>🔥</span>
              <span>₹1,000 Mega Challenge Arena</span>
              <span style={{ color: '#f43f5e', fontSize: '14px' }}>•••</span>
            </div>

            {/* Main Title matching Screenshot 1 */}
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
              lineHeight: 1.15,
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em'
            }}>
              Play Snake. Top the Board. <br />
              <span style={{
                fontFamily: 'serif',
                fontStyle: 'italic',
                fontWeight: '600',
                color: '#0f172a'
              }}>
                Win Luxury Prizes!
              </span>{' '}
              <span role="img" aria-label="trophy">🏆</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
              lineHeight: 1.6,
              color: '#64748b',
              marginBottom: '2rem',
              maxWidth: '540px'
            }}>
              Enter verified skill tournaments for ₹1,000. Claim 100% Guaranteed Luxury Apparel delivered to your home, and compete in the retro Snake challenge to win the grand prize!
            </p>

            {/* CTA Button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '2rem' }}>
              <button
                onClick={onBrowseTournaments}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(2, 132, 199, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(2, 132, 199, 0.4)';
                }}
              >
                <span>🔥 Browse Available Tournaments</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Trust Badges matching Screenshot 1 */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#475569'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>100% Guaranteed Gift</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} color="#0284c7" />
                <span>Free Doorstep Shipping</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gamepad2 size={16} color="#f59e0b" />
                <span>Fair Nokia Snake II Arena</span>
              </div>
            </div>
          </div>

          {/* Right Featured Product Card matching Screenshot 1 */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Soft oval cyan gradient glow backdrop */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50% 50% 40% 40%',
                background: 'linear-gradient(145deg, #e0f2fe 0%, #bae6fd 60%, #e0e7ff 100%)',
                opacity: 0.85,
                zIndex: 0,
                filter: 'blur(2px)'
              }} />

              {/* Floating Guaranteed Reward Badge */}
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '20px',
                zIndex: 2,
                background: '#ffffff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                borderRadius: '10px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }} />
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    GUARANTEED REWARD
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                    Free Apparel Choice Delivered
                  </div>
                </div>
              </div>

              {/* Heart Badge top right */}
              <button
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  zIndex: 2,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f43f5e'
                }}
              >
                <Heart size={18} fill="#f43f5e" />
              </button>

              {/* Luxury Product Image */}
              <div 
                onClick={() => featuredTournament && onSelectTournament && onSelectTournament(featuredTournament)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: '24px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 20px 35px -10px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s ease',
                  width: '320px',
                  height: '380px',
                  background: '#0b1120'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <img
                  src={featuredTournament?.image_url || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80"}
                  alt="Featured Grand Prize"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '16px',
                  background: 'linear-gradient(to top, rgba(11, 17, 32, 0.95), transparent)',
                  color: '#ffffff'
                }}>
                  <div style={{ fontSize: '10px', color: featuredTournament?.start_time && new Date(featuredTournament.start_time).getTime() > Date.now() ? '#c084fc' : '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {featuredTournament?.start_time && new Date(featuredTournament.start_time).getTime() > Date.now()
                      ? `⏳ Upcoming Challenge • Starts ${new Date(featuredTournament.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                      : (featuredTournament?.banner_tag || 'Featured 5-Day Challenge')}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800' }}>
                    {featuredTournament?.title || "iPhone 16 Pro Max 256GB Titanium"}
                  </div>
                  {featuredTournament?.my_score !== null && featuredTournament?.my_score !== undefined && (
                    <div style={{
                      margin: '4px 0',
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#a7f3d0'
                    }}>
                      <Trophy size={12} color="#34d399" />
                      <span>Your Score: {featuredTournament.my_score} pts {featuredTournament.my_rank ? `(Rank #${featuredTournament.my_rank})` : ''}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
                      Entry Fee: ₹1,000
                    </span>
                    <span style={{
                      fontSize: '11px',
                      background: featuredTournament?.start_time && new Date(featuredTournament.start_time).getTime() > Date.now()
                        ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                        : (featuredTournament?.my_score !== null && featuredTournament?.my_score !== undefined ? '#10b981' : '#0284c7'),
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontWeight: '800'
                    }}>
                      {featuredTournament?.start_time && new Date(featuredTournament.start_time).getTime() > Date.now()
                        ? 'Pre-Register →'
                        : (featuredTournament?.my_score !== null && featuredTournament?.my_score !== undefined ? 'Play & Improve →' : 'Join Contest →')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Value Proposition Cards matching Screenshot 1 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          {/* Card 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}>
              <Gift size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                100% Guaranteed Gift
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Apparel shipped with every entry
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                Zero Financial Risk
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Apparel value exceeds participation fee
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <Trophy size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                Transparent Leaderboard
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Live real-time score ranking
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
