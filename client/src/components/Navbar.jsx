import React, { useState } from 'react';
import { 
  Trophy, Search, ShoppingBag, User, LogOut, Shield, 
  Gamepad2, Sparkles, ChevronDown, CheckCircle2, Menu, X, ArrowRight,
  Crown, Zap, Target, Flame
} from 'lucide-react';

export default function Navbar({ 
  user, 
  appSettings,
  onOpenAuth, 
  onLogout, 
  onOpenOrders, 
  onOpenProfile,
  onOpenAdmin, 
  onSelectCategory,
  onSearch,
  searchQuery,
  setSearchQuery,
  onOpenSnake
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const staffRoles = ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Support'];
  const isStaff = user && staffRoles.includes(user.role);

  const renderNavIcon = (iconName) => {
    switch (iconName) {
      case 'Shield': return <Shield size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Trophy': return <Trophy size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Gamepad2': return <Gamepad2 size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Crown': return <Crown size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Sparkles': return <Sparkles size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Zap': return <Zap size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Target': return <Target size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'Flame': return <Flame size={20} color="#ffffff" strokeWidth={2.5} />;
      case 'ShoppingBag':
      default:
        return <ShoppingBag size={20} color="#ffffff" strokeWidth={2.5} />;
    }
  };

  const appName = appSettings?.app_name || 'WinArena';

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Main Navbar */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', gap: '12px' }}>
        {/* Brand Logo */}
        <div 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          {appSettings?.logo_url ? (
            <img
              src={appSettings.logo_url}
              alt={appName}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                objectFit: 'contain',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            />
          ) : (
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.35)'
            }}>
              {renderNavIcon(appSettings?.logo_icon || 'ShoppingBag')}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#0f172a', letterSpacing: '-0.5px' }}>
              {appName === 'WinArena' ? (
                <>Win<span style={{ color: '#0284c7' }}>Arena</span></>
              ) : (
                appName
              )}
            </span>
          </div>
        </div>


        {/* Desktop Nav & Search (Home & All Tournaments placed right beside Search Bar) */}
        <div 
          className="desktop-search-group"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            flex: '1', 
            maxWidth: '560px',
            marginLeft: 'auto',
            marginRight: '14px'
          }}
        >
          {/* Nav Links (Desktop) */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '4px' }} className="desktop-nav">
            <button
              onClick={() => {
                onSelectCategory('All');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                background: 'transparent',
                color: '#0f172a',
                fontWeight: '600',
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f9ff';
                e.target.style.color = '#0284c7';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#0f172a';
              }}
            >
              Home
            </button>

            <button
              onClick={() => {
                onSelectCategory('All');
                const el = document.getElementById('tournaments-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 450, behavior: 'smooth' });
                }
              }}
              style={{
                background: 'transparent',
                color: '#475569',
                fontWeight: '600',
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f9ff';
                e.target.style.color = '#0284c7';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#475569';
              }}
            >
              <Trophy size={15} color="#0284c7" />
              <span>All Tournaments</span>
            </button>
          </nav>

          {/* Desktop Search Bar */}
          <div className="desktop-search" style={{ flex: '1', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search prizes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 38px 9px 14px',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
            <button
              onClick={() => onSearch && onSearch(searchQuery)}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mobile Search Icon Toggle */}
          <button
            className="mobile-search-btn"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            title="Search challenges"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: mobileSearchOpen ? '#e0f2fe' : '#f1f5f9',
              border: mobileSearchOpen ? '1.5px solid #0284c7' : 'none',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: mobileSearchOpen ? '#0284c7' : '#334155',
              cursor: 'pointer'
            }}
          >
            {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Guaranteed Orders Bag */}
          <button
            onClick={onOpenOrders}
            title="My Orders & Guaranteed Deliveries"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#f1f5f9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={18} />
            {user?.stats?.totalOrders > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#0284c7',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user.stats.totalOrders}
              </span>
            )}
          </button>

          {/* User Auth: Clean Avatar Icon (No Text/Name) */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                title={user.name}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isStaff ? '#0284c7' : '#8b5cf6',
                  border: isStaff ? '2px solid #0284c7' : '2px solid #e2e8f0',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user.name ? user.name.substring(0, 2).toUpperCase() : 'US'
                )}
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '45px',
                    width: '240px',
                    background: '#ffffff',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    padding: '8px',
                    zIndex: 200,
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{user.email}</div>
                    <div style={{
                      marginTop: '4px',
                      display: 'inline-block',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0'
                    }}>
                      Role: {user.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenProfile && onOpenProfile();
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'transparent',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#0f172a',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    <User size={16} color="#0284c7" />
                    Profile & Delivery Address
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenOrders();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'transparent',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#334155',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    <ShoppingBag size={16} color="#0284c7" />
                    My Guaranteed Apparel Orders
                  </button>


                  {/* Admin Portal access for authorized staff */}
                  {isStaff && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAdmin();
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#eff6ff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0284c7',
                        textAlign: 'left',
                        marginTop: '4px'
                      }}
                    >
                      <Shield size={16} />
                      Staff Control Console ({user.role})
                    </button>
                  )}

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '6px 0' }} />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'transparent',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#dc2626',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
                    onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenAuth('login')}
                style={{
                  background: 'transparent',
                  color: '#0284c7',
                  fontSize: '13px',
                  fontWeight: '700',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <User size={14} />
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Strip */}
      {mobileSearchOpen && (
        <div style={{
          padding: '8px 16px 12px 16px',
          background: '#ffffff',
          borderTop: '1px solid #f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder="Search challenges & prizes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 38px 9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #0284c7',
                background: '#f8fafc',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <Search size={16} color="#0284c7" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 820px) {
          .desktop-nav {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .desktop-search-group {
            display: flex !important;
          }
          .desktop-search {
            display: block !important;
          }
          .mobile-search-btn {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-search-group {
            display: none !important;
          }
          .desktop-search {
            display: none !important;
          }
          .mobile-search-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
