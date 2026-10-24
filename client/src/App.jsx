import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MobileBottomBar from './components/MobileBottomBar';
import Hero from './components/Hero';
import TrendingChallenges from './components/TrendingChallenges';
import GuaranteedApparelSection from './components/GuaranteedApparelSection';
import TournamentDetailsModal from './components/TournamentDetailsModal';
import PaymentModal from './components/PaymentModal';
import SnakeGameModal from './components/SnakeGameModal';
import MyOrdersModal from './components/MyOrdersModal';
import AdminPortalModal from './components/AdminPortalModal';
import LeaderboardModal from './components/LeaderboardModal';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [userEntryForSelected, setUserEntryForSelected] = useState(null);
  const [userRankForSelected, setUserRankForSelected] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [authModal, setAuthModal] = useState(null); // 'login', 'register', or null
  const [paymentData, setPaymentData] = useState(null);
  const [snakeGameTournamentId, setSnakeGameTournamentId] = useState(null);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);

  // Global Dynamic Application Settings (Logo, App Name, Branding)
  const [appSettings, setAppSettings] = useState({
    app_name: 'WinArena',
    app_tagline: 'Skill-Based Competitions & Guaranteed Apparel Rewards',
    logo_url: '',
    logo_icon: 'ShoppingBag',
    admin_header_title: 'WinArena',
    admin_header_badge: 'CONTROL',
    admin_header_subtitle: 'Operations & Ops Console',
    footer_copyright_text: '© 2026 WinArena Technologies. All rights reserved.'
  });

  const loadAppSettings = async () => {
    try {
      const res = await api.settings.getPublic();
      if (res.success && res.settings) {
        setAppSettings(res.settings);
        if (res.settings.app_name) {
          document.title = `${res.settings.app_name} - ${res.settings.app_tagline || '5-Day Skill Competitions'}`;
        }
      }
    } catch (err) {
      console.warn('Could not load app settings, using defaults:', err);
    }
  };

  // Mobile Bottom Tab
  const [mobileTab, setMobileTab] = useState('home');

  // Load User profile & Tournaments & Gifts on initial mount
  const loadInitialData = async () => {
    try {
      // 0. Fetch Global App Settings
      await loadAppSettings();

      // 1. Check logged in user
      const token = localStorage.getItem('winarena_token');
      if (token) {
        try {
          const userRes = await api.auth.getMe();
          if (userRes.success) {
            setUser(userRes.user);
          }
        } catch (e) {
          localStorage.removeItem('winarena_token');
          setUser(null);
        }
      }

      // 2. Fetch Tournaments
      const tourRes = await api.tournaments.getAll();
      if (tourRes.success) {
        setTournaments(tourRes.tournaments);
      }

      // 3. Fetch Guaranteed Gifts (Active Only for public users)
      const giftRes = await api.gifts.getAll();
      if (giftRes.success) {
        setGifts((giftRes.gifts || []).filter(g => g.is_active !== false));
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);


  // When user selects a tournament, fetch detailed tournament info (including user entry)
  const handleSelectTournament = async (tournament) => {
    try {
      const res = await api.tournaments.getByIdOrSlug(tournament.slug || tournament.id);
      if (res.success) {
        setSelectedTournament(res.tournament);
        setUserEntryForSelected(res.userEntry);
        setUserRankForSelected(res.userRank);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setSelectedTournament(tournament);
    }
  };

  // Re-fetch details when user joins or submits a score
  const refreshCurrentTournamentDetails = async () => {
    if (selectedTournament) {
      const res = await api.tournaments.getByIdOrSlug(selectedTournament.id);
      if (res.success) {
        setSelectedTournament(res.tournament);
        setUserEntryForSelected(res.userEntry);
        setUserRankForSelected(res.userRank);
      }
    }
    // Also refresh tournament list
    const tourRes = await api.tournaments.getAll();
    if (tourRes.success) {
      setTournaments(tourRes.tournaments);
    }
    // Also refresh guaranteed gifts list (Active only)
    const giftRes = await api.gifts.getAll();
    if (giftRes.success) {
      setGifts((giftRes.gifts || []).filter(g => g.is_active !== false));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('winarena_token');
    setUser(null);
    setUserEntryForSelected(null);
    setUserRankForSelected(null);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthModal(null);
    refreshCurrentTournamentDetails();
  };

  // Checkout & Payment flow
  const handleProceedToPayment = (checkoutPayload) => {
    setPaymentData(checkoutPayload);
  };

  const handlePaymentSuccess = async (order, entry) => {
    // Refresh user stats & tournament details
    try {
      const meRes = await api.auth.getMe();
      if (meRes.success) setUser(meRes.user);
    } catch (e) {}

    await refreshCurrentTournamentDetails();

    // Automatically open the Nokia Snake II arcade game!
    if (selectedTournament) {
      setSnakeGameTournamentId(selectedTournament.id);
    }
  };

  // Filter out deactivated/inactive and concluded tournaments for featured spotlight on home page
  const activeTournaments = tournaments.filter((t) => t.status !== 'INACTIVE' && t.status !== 'CONCLUDED');
  const featuredTournament = 
    activeTournaments.find((t) => t.is_featured && t.status === 'ACTIVE') || 
    activeTournaments.find((t) => t.status === 'ACTIVE') || 
    activeTournaments.find((t) => t.is_featured) || 
    activeTournaments[0] || 
    null;

  return (
    <div className="has-mobile-bottom-bar" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        user={user}
        appSettings={appSettings}
        onOpenAuth={(mode) => setAuthModal(mode)}
        onLogout={handleLogout}

        onOpenOrders={() => setOrdersModalOpen(true)}
        onOpenProfile={() => {
          setProfileModalTab('profile');
          setProfileModalOpen(true);
        }}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (selectedTournament) setSelectedTournament(null);
          const el = document.getElementById('tournaments-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={async (q) => {
          const res = await api.tournaments.getAll({ search: q });
          if (res.success) setTournaments(res.tournaments);
        }}
        onOpenSnake={() => {
          if (featuredTournament) {
            setSnakeGameTournamentId(featuredTournament.id);
          }
        }}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {selectedTournament ? (
          /* Tournament Challenge Details View (Screenshot 2) */
          <TournamentDetailsModal
            tournament={selectedTournament}
            gifts={gifts}
            user={user}
            userEntry={userEntryForSelected}
            userRank={userRankForSelected}
            onBack={() => setSelectedTournament(null)}
            onProceedToPayment={handleProceedToPayment}
            onOpenSnakeGame={(tourId) => setSnakeGameTournamentId(tourId)}
            onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
            onOpenAuth={(mode) => setAuthModal(mode)}
            onOpenProfile={(tab = 'profile') => {
              setProfileModalTab(tab);
              setProfileModalOpen(true);
            }}
          />
        ) : (
          /* Homepage Discovery View (Screenshot 1) */
          <>
            <Hero
              featuredTournament={featuredTournament}
              onSelectTournament={handleSelectTournament}
              onBrowseTournaments={() => {
                const el = document.getElementById('tournaments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <TrendingChallenges
              tournaments={tournaments}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectTournament={handleSelectTournament}
              onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
              onOpenSnakeGame={(tourId) => setSnakeGameTournamentId(tourId)}
            />

            <GuaranteedApparelSection
              gifts={gifts}
              onSelectGiftForChallenge={() => {
                if (featuredTournament) {
                  handleSelectTournament(featuredTournament);
                }
              }}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0b1120', color: '#94a3b8', padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem' }}>
          <div style={{ maxWidth: '360px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
              Win<span style={{ color: '#0284c7' }}>Arena</span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
              India's premier verified skill tournament platform. ₹1,000 entry fee includes 100% free guaranteed luxury apparel delivered home via BlueDart Express courier.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase' }}>
              Legal & Fair Play
            </div>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', lineHeight: 2 }}>
              <li>100% Pure Skill-Based Gaming</li>
              <li>Official GST Invoice & Packing Slips</li>
              <li>Verified Leaderboard Architecture</li>
              <li>BlueDart Courier Tracking</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase' }}>
              Guaranteed Apparel
            </div>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', lineHeight: 2 }}>
              <li>Urban Heavyweight Streetwear T-Shirt</li>
              <li>Kanchipuram Art Silk Floral Saree</li>
              <li>Handcrafted Designer Chanderi Kurti</li>
              <li>Zero Financial Risk Guarantee</li>
            </ul>
          </div>
        </div>

        <div className="container" style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px' }}>
          {appSettings?.footer_copyright_text || '© 2026 WinArena Technologies. All rights reserved. Built with React.js, Node.js, Express & PostgreSQL.'}
        </div>
      </footer>

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomBar
        activeTab={mobileTab}
        setActiveTab={(tab) => {
          setMobileTab(tab);
          if (tab === 'home') {
            setSelectedTournament(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenSnake={() => {
          if (featuredTournament) {
            setSnakeGameTournamentId(featuredTournament.id);
          }
        }}
        onOpenOrders={() => setOrdersModalOpen(true)}
        onOpenProfile={() => {
          setProfileModalTab('profile');
          setProfileModalOpen(true);
        }}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenAuth={(m) => setAuthModal(m)}
        user={user}
      />

      {/* MODALS */}
      {/* 1. Auth Modal */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* 2. Step 4: UPI Payment Modal */}
      {paymentData && (
        <PaymentModal
          checkoutData={paymentData}
          onClose={() => setPaymentData(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* 3. Step 5: Nokia Snake II Arcade Game Modal */}
      {snakeGameTournamentId && (
        <SnakeGameModal
          tournamentId={snakeGameTournamentId}
          tournamentTitle={selectedTournament?.title || 'WinArena 5-Day Skill Challenge'}
          onClose={() => setSnakeGameTournamentId(null)}
          onScoreSubmitted={async (res) => {
            await refreshCurrentTournamentDetails();
          }}
        />
      )}

      {/* 4. Step 6: My Orders & Logistics Deliveries */}
      {ordersModalOpen && (
        <MyOrdersModal
          onClose={() => setOrdersModalOpen(false)}
        />
      )}

      {/* 5. User Profile & Delivery Address Settings */}
      {profileModalOpen && user && (
        <UserProfileModal
          user={user}
          initialTab={profileModalTab}
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdated={(updatedUser) => {
            setUser((prev) => ({ ...prev, ...updatedUser }));
          }}
        />
      )}

      {/* 6. Role-Based Admin Portal */}
      {adminModalOpen && (
        <AdminPortalModal
          user={user}
          appSettings={appSettings}
          onUpdateAppSettings={loadAppSettings}
          onClose={() => setAdminModalOpen(false)}
          onRefreshData={refreshCurrentTournamentDetails}
        />
      )}


      {/* 6. Live Public Leaderboard Modal */}
      {leaderboardModalOpen && (
        <LeaderboardModal
          tournament={selectedTournament || featuredTournament}
          tournaments={tournaments}
          onClose={() => setLeaderboardModalOpen(false)}
          onPlayTournament={(tour) => {
            handleSelectTournament(tour);
          }}
        />
      )}
    </div>
  );
}
