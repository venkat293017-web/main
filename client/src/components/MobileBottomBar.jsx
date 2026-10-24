import React from 'react';
import { Home, Trophy, Gamepad2, PackageCheck, Shield, User } from 'lucide-react';

export default function MobileBottomBar({
  activeTab,
  setActiveTab,
  onOpenSnake,
  onOpenOrders,
  onOpenProfile,
  onOpenAdmin,
  onOpenAuth,
  user
}) {
  const staffRoles = ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Support'];
  const isStaff = user && staffRoles.includes(user.role);

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '66px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 999,
        boxShadow: '0 -4px 15px rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Home / Discovery */}
      <button
        onClick={() => {
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          color: activeTab === 'home' ? '#0284c7' : '#64748b',
          fontSize: '11px',
          fontWeight: activeTab === 'home' ? '700' : '500',
          padding: '6px 12px'
        }}
      >
        <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span>Home</span>
      </button>

      {/* Tournaments */}
      <button
        onClick={() => {
          setActiveTab('tournaments');
          const el = document.getElementById('tournaments-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          color: activeTab === 'tournaments' ? '#0284c7' : '#64748b',
          fontSize: '11px',
          fontWeight: activeTab === 'tournaments' ? '700' : '500',
          padding: '6px 12px'
        }}
      >
        <Trophy size={20} strokeWidth={activeTab === 'tournaments' ? 2.5 : 2} />
        <span>Tournaments</span>
      </button>

      {/* Play Snake Arcade Center Button */}
      <button
        onClick={onOpenSnake}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          background: 'none',
          marginTop: '-18px',
          padding: 0
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.45)',
            color: '#ffffff',
            border: '3px solid #ffffff'
          }}
        >
          <Gamepad2 size={24} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: '800', color: '#059669' }}>
          Snake II
        </span>
      </button>

      {/* My Apparel Orders */}
      <button
        onClick={onOpenOrders}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          color: activeTab === 'orders' ? '#0284c7' : '#64748b',
          fontSize: '11px',
          fontWeight: activeTab === 'orders' ? '700' : '500',
          padding: '6px 12px',
          position: 'relative'
        }}
      >
        <PackageCheck size={20} strokeWidth={activeTab === 'orders' ? 2.5 : 2} />
        <span>Orders</span>
        {user?.stats?.totalOrders > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '18px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#0284c7'
            }}
          />
        )}
      </button>

      {/* Profile / Admin */}
      <button
        onClick={() => {
          if (!user) {
            onOpenAuth('login');
          } else if (onOpenProfile) {
            onOpenProfile();
          } else if (isStaff) {
            onOpenAdmin();
          } else {
            onOpenOrders();
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'none',
          color: isStaff ? '#0284c7' : '#64748b',
          fontSize: '11px',
          fontWeight: '500',
          padding: '6px 12px'
        }}
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Profile"
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : isStaff ? (
          <Shield size={20} color="#0284c7" />
        ) : (
          <User size={20} />
        )}
        <span>{user ? 'Profile' : 'Login'}</span>
      </button>

      <style>{`
        @media (min-width: 769px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
