import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, ShieldCheck, Truck, Trophy, CheckCircle2, 
  Clock, Gift, Gamepad2, ChevronRight, Lock, MapPin, Phone, User, Check, RotateCw,
  AlertCircle, Edit2, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function TournamentDetailsModal({
  tournament,
  gifts = [],
  user,
  userEntry,
  userRank,
  onBack,
  onProceedToPayment,
  onOpenSnakeGame,
  onOpenLeaderboard,
  onOpenAuth,
  onOpenProfile
}) {
  const activeGifts = gifts.filter((g) => g.is_active !== false);
  const [selectedImage, setSelectedImage] = useState(tournament.image_url);
  const [selectedGiftId, setSelectedGiftId] = useState(activeGifts[0]?.id || null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const scrollToLeaderboard = () => {
    const el = document.getElementById('official-leaderboard-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Real dynamic leaderboard state for this challenge
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = async () => {
    if (!tournament?.id) return;
    setLoadingLeaderboard(true);
    try {
      const res = await api.tournaments.getLeaderboard(tournament.id);
      if (res.success) {
        setLeaderboard(res.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load challenge leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [tournament?.id, userEntry?.high_score]);

  // Shipping form state - Strictly retrieved from user profile
  const [shippingName, setShippingName] = useState(user?.name || '');
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [shippingCity, setShippingCity] = useState(user?.city || '');
  const [shippingPincode, setShippingPincode] = useState(user?.pincode || '');
  const [shippingState, setShippingState] = useState(user?.state || 'Tamil Nadu');
  const [formError, setFormError] = useState('');

  // Keep shipping details in sync with user profile
  useEffect(() => {
    if (user) {
      setShippingName(user.name || '');
      setShippingPhone(user.phone || '');
      setShippingAddress(user.address || '');
      setShippingCity(user.city || '');
      setShippingPincode(user.pincode || '');
      setShippingState(user.state || 'Tamil Nadu');
    } else {
      setShippingName('');
      setShippingPhone('');
      setShippingAddress('');
      setShippingCity('');
      setShippingPincode('');
    }
  }, [user]);

  // Profile address validation checks
  const isProfileAddressEmpty = !user || !user.address || !user.address.trim();
  const isProfilePhoneEmpty = !user || !user.phone || !user.phone.trim();
  const isProfileCityEmpty = !user || !user.city || !user.city.trim();
  const isProfilePincodeEmpty = !user || !user.pincode || !user.pincode.trim();
  const isProfileMissing = isProfileAddressEmpty || isProfilePhoneEmpty || isProfileCityEmpty || isProfilePincodeEmpty;

  // Update selected gift defaults when gifts load
  useEffect(() => {
    if (activeGifts.length > 0 && (!selectedGiftId || !activeGifts.some(g => g.id === selectedGiftId))) {
      setSelectedGiftId(activeGifts[0].id);
    }
  }, [gifts, selectedGiftId]);

  const selectedGift = activeGifts.find((g) => g.id === selectedGiftId) || activeGifts[0];

  useEffect(() => {
    if (selectedGift?.options?.sizes?.length > 0) {
      setSelectedSize(selectedGift.options.sizes[0]);
    }
    if (selectedGift?.options?.colors?.length > 0) {
      setSelectedColor(selectedGift.options.colors[0]);
    }
  }, [selectedGiftId]);

  const isConcluded = tournament.status === 'CONCLUDED' || Boolean(tournament.winner_id && tournament.status !== 'ACTIVE');
  const isUpcoming = tournament.status === 'ACTIVE' && tournament.start_time && new Date(tournament.start_time).getTime() > Date.now();
  const hasJoined = Boolean(userEntry);

  const cleanWinnerName = (
    tournament.winner_user_name ||
    tournament.winner_name ||
    'Declared Champion'
  ).replace(/\s*\(Declared Champion.*?\)/gi, '').trim();

  const winnerScore = tournament.winner_verified_score || tournament.winner_score || 0;
  const winnerCity = tournament.winner_city || '';
  const winnerState = tournament.winner_state || '';
  const winnerLocation = [winnerCity, winnerState].filter(Boolean).join(', ') || 'Tamil Nadu, India';
  const winnerAvatar = tournament.winner_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanWinnerName)}&background=f59e0b&color=ffffff&bold=true&size=200`;
  const winnerGamesPlayed = tournament.winner_games_played || 1;
  const isCurrentUserWinner = Boolean(user && (
    user.id === tournament.winner_id ||
    user.id === tournament.winner_user_id ||
    (user.name && cleanWinnerName && user.name.toLowerCase() === cleanWinnerName.toLowerCase())
  ));

  const handleJoinClick = () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    // Profile Address Validation: Address must be saved in user profile
    if (isProfileMissing) {
      let errMsg = 'Delivery address profile-il illai. Please add your delivery address in your profile to proceed.';
      if (isProfileAddressEmpty) {
        errMsg = 'Delivery address is missing in your profile! Please add your delivery address in your profile to join the challenge.';
      } else if (isProfilePhoneEmpty) {
        errMsg = 'Contact mobile number is missing in your profile! Please add your phone number in your profile.';
      } else if (isProfileCityEmpty || isProfilePincodeEmpty) {
        errMsg = 'City or Pincode is missing in your profile! Please complete your delivery address in your profile.';
      }
      setFormError(errMsg);
      if (onOpenProfile) {
        onOpenProfile('address');
      }
      return;
    }

    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingCity.trim() || !shippingPincode.trim()) {
      setFormError('Please fill in your complete shipping address & contact details for guaranteed delivery.');
      return;
    }

    setFormError('');

    onProceedToPayment({
      tournament_id: tournament.id,
      tournament_title: tournament.title,
      entry_fee: tournament.entry_fee,
      gift_id: selectedGift.id,
      gift_name: selectedGift.name,
      gift_category: selectedGift.category,
      gift_image: selectedGift.image_url,
      selected_size: selectedSize,
      selected_color: selectedColor,
      shipping_name: shippingName || user.name,
      shipping_phone: shippingPhone || user.phone,
      shipping_address: shippingAddress || user.address,
      shipping_city: shippingCity || user.city,
      shipping_state: shippingState || user.state || 'Tamil Nadu',
      shipping_pincode: shippingPincode || user.pincode,
    });
  };

  const gallery = tournament.gallery_urls?.length ? tournament.gallery_urls : [tournament.image_url];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Top Breadcrumb Header */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              color: '#0284c7',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Challenges</span>
          </button>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#64748b' }}>{tournament.category}</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#0f172a', fontWeight: '700' }}>{tournament.title}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        {/* Main 2-Column Responsive Layout */}
        <div className="product-details-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.02fr 1.35fr',
          gap: '2.5rem',
          alignItems: 'start',
          marginBottom: '2.5rem'
        }}>
          {/* Column 1 (Left): Showcase Gallery + Grand Prize Highlights & Trust Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Main Showcase Image Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '420px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#0b1120',
                marginBottom: '12px'
              }}>
                <img
                  src={selectedImage}
                  alt={tournament.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Top Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: isConcluded 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : '#10b981',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {isConcluded ? '🏆 Grand Prize Winner Declared' : '🔥 Active Skill Contest'}
                </div>

                {/* Champion Claimed Ribbon Over Showcase Image */}
                {isConcluded && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      👑
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#fcd34d', textTransform: 'uppercase' }}>
                        Won By Champion
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cleanWinnerName} • Winning Score: {winnerScore} pts
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: selectedImage === img ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      padding: 0,
                      flexShrink: 0,
                      background: '#000',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>100% Brand Sealed Official Unit with Manufacturer Warranty</span>
              </div>
            </div>

            {/* About This Grand Prize & Authenticity Specs */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={16} color="#0284c7" />
                <span>About This Grand Prize & Contest Rules:</span>
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: 1.8 }}>
                <li><strong>100% Genuine Brand Sourced:</strong> Brand new sealed retail unit with valid manufacturer warranty card & invoice.</li>
                <li><strong>Guaranteed Apparel Choice:</strong> Every participant receives their chosen apparel delivered home via express BlueDart courier.</li>
                <li><strong>Skill-Based Retro Snake II:</strong> Top high score wins the grand prize. Zero luck, pure skill. Instant verified leaderboard updates.</li>
                <li><strong>Free Express Delivery:</strong> Safe doorstep courier delivery across India at zero extra cost.</li>
              </ul>
            </div>
          </div>

          {/* Column 2 (Right): Challenge Details & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Details Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
            }}>
              {/* Partner Hub / Upcoming Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {isConcluded ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '900',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase'
                  }}>
                    <Trophy size={13} />
                    <span>🏆 WINNER DECLARED • CHALLENGE CONCLUDED</span>
                  </span>
                ) : isUpcoming ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                  }}>
                    <Clock size={13} />
                    <span>UPCOMING CHALLENGE • STARTS {new Date(tournament.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                ) : (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#0284c7',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase'
                  }}>
                    {tournament.badge_text || 'OFFICIAL PARTNER HUB'}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
                fontWeight: '800',
                color: '#0f172a',
                lineHeight: 1.25,
                marginBottom: '10px'
              }}>
                {tournament.title}
              </h1>

              {/* UPCOMING PRE-REGISTRATION BANNER */}
              {isUpcoming && (
                <div style={{
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                  border: '1.5px solid #c4b5fd',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#7c3aed',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    ⏳
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#5b21b6' }}>
                      Pre-Registration is Live!
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#6d28d9', marginTop: '2px' }}>
                      Reserve your guaranteed luxury apparel gift now. Competition opens on <strong>{new Date(tournament.start_time).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>!
                    </div>
                  </div>
                </div>
              )}

              {/* Rating & Participants */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', color: '#f59e0b' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" />
                  ))}
                </div>
                <strong style={{ color: '#0f172a' }}>5</strong>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span style={{ color: '#0284c7', fontWeight: '600' }}>1 verified ratings</span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span style={{ color: '#64748b' }}>{tournament.slots_filled || 280}+ participated</span>
              </div>

              {/* Price Tag Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#e11d48',
                      background: '#ffe4e6',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      -99% VALUE
                    </span>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>
                      ₹{Number(tournament.entry_fee).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '15px', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{Number(tournament.retail_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
                    Includes guaranteed choice of branded apparel + free courier shipping.
                  </p>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={16} color="#15803d" />
                  <span>Guaranteed Apparel Included</span>
                </div>
              </div>

              {/* 4 Feature Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}>
                <div style={{ textAlign: 'center', padding: '10px 4px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <Truck size={18} color="#0284c7" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Free Courier</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 4px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <ShieldCheck size={18} color="#10b981" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Fair Play</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 4px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <Trophy size={18} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Top Brand</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 4px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <Gamepad2 size={18} color="#8b5cf6" style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Live Ranks</div>
                </div>
              </div>
            </div>

            {/* PLAYER STATUS / ENROLLED VIEW */}
            {isConcluded ? (
              /* Grand Prize Champion Winner Profile Showcase */
              <div style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #fffbeb 50%, #fef3c7 100%)',
                borderRadius: '24px',
                padding: '24px',
                border: '2px solid #fcd34d',
                boxShadow: '0 12px 35px rgba(245, 158, 11, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Subtle Trophy Watermark in Background */}
                <div style={{
                  position: 'absolute',
                  right: '-15px',
                  top: '-15px',
                  opacity: 0.07,
                  pointerEvents: 'none'
                }}>
                  <Trophy size={170} color="#b45309" />
                </div>

                {/* Winner Announcement Header Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '900',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3)',
                  marginBottom: '16px'
                }}>
                  <Trophy size={14} />
                  <span>Official Grand Prize Winner Announced</span>
                </div>

                {/* Congratulations Banner if the viewer is the winner */}
                {isCurrentUserWinner && (
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                  }}>
                    <span style={{ fontSize: '28px' }}>🎉</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900' }}>
                        CONGRATULATIONS {user.name.toUpperCase()}! YOU ARE THE WINNER!
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.95, marginTop: '2px' }}>
                        You topped the all-India leaderboard with {winnerScore} points! Our logistics team is dispatching your {tournament.title} to your address.
                      </div>
                    </div>
                  </div>
                )}

                {/* Champion Profile Card */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '18px',
                  border: '1.5px solid #fde68a',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Profile Avatar with Floating Crown */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3.5px solid #f59e0b',
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                        background: '#fef3c7'
                      }}>
                        <img
                          src={winnerAvatar}
                          alt={cleanWinnerName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanWinnerName)}&background=f59e0b&color=ffffff&bold=true&size=200`;
                          }}
                        />
                      </div>
                      {/* Floating Crown Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-6px',
                        background: '#ffffff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        border: '1.5px solid #f59e0b',
                        fontSize: '15px'
                      }}>
                        👑
                      </div>
                    </div>

                    {/* Name, Verified Status & Location */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '900',
                          color: '#0f172a',
                          margin: 0,
                          lineHeight: 1.2
                        }}>
                          {cleanWinnerName}
                        </h3>
                        <span style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={12} color="#059669" />
                          <span>VERIFIED WINNER</span>
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '6px',
                        fontSize: '12.5px',
                        color: '#64748b',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#475569' }}>
                          <MapPin size={13} color="#0284c7" />
                          <span>{winnerLocation}</span>
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ color: '#d97706', fontWeight: '700' }}>
                          WinArena Hall of Fame
                        </span>
                      </div>

                      <div style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>🏆 Official 1st Place Champion for this Challenge</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Championship Stats Highlight Pillars */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Winning Score
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#b45309' }}>
                      {winnerScore}
                      <span style={{ fontSize: '11px', fontWeight: '700', marginLeft: '2px', color: '#d97706' }}>pts</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
                      High Score Verified
                    </div>
                  </div>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Leaderboard
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#047857' }}>
                      #1
                      <span style={{ fontSize: '11px', fontWeight: '700', marginLeft: '3px', color: '#059669' }}>Rank</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
                      National Champion
                    </div>
                  </div>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Skill Runs
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>
                      {winnerGamesPlayed}
                      <span style={{ fontSize: '11px', fontWeight: '700', marginLeft: '2px', color: '#64748b' }}>runs</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '2px' }}>
                      Retro Arcade
                    </div>
                  </div>
                </div>

                {/* Won Grand Prize Claim Callout */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#0b1120',
                    flexShrink: 0
                  }}>
                    <img
                      src={tournament.image_url}
                      alt={tournament.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#92400e', textTransform: 'uppercase' }}>
                      Grand Prize Claimed by Winner:
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tournament.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                      100% Brand Sealed Retail Unit with Manufacturer Warranty • Dispatched
                    </div>
                  </div>
                </div>

                {/* Current User Result (if user participated but is not winner) */}
                {hasJoined && !isCurrentUserWinner && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Gamepad2 size={18} color="#0284c7" />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Your Challenge Performance
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                          Score: {userEntry?.high_score || 0} pts {userRank ? `• Placed #${userRank}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      Guaranteed Gift Delivered via BlueDart
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={scrollToLeaderboard}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '14px',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    <Trophy size={18} />
                    <span>View Final Leaderboard</span>
                  </button>

                  <button
                    onClick={onBack}
                    style={{
                      background: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Explore Active Challenges</span>
                  </button>
                </div>
              </div>
            ) : hasJoined ? (
              /* Enrolled User Standing Card (Eliminates the redundant Gift Picker & Buy button!) */
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                borderRadius: '20px',
                padding: '24px',
                border: '1.5px solid #86efac',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)'
                    }}>
                      <Trophy size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>
                        Your Official Challenge Standing
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#065f46' }}>
                        You're Enrolled & Ready to Compete!
                      </div>
                    </div>
                  </div>

                  <span style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    fontSize: '13px',
                    fontWeight: '800',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    Live Rank: #{userRank || 1}
                  </span>
                </div>

                {/* Score & Enrolled Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '18px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>High Score</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7' }}>
                      {userEntry?.high_score !== undefined ? userEntry.high_score : 0} pts
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Selected Gift</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                      {userEntry?.gift_name || 'Guaranteed Apparel'} ({userEntry?.selected_size || 'M'})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Delivering to</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                      {userEntry?.shipping_city || 'Chennai'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {isUpcoming ? (
                    <div style={{
                      flex: 1,
                      minWidth: '220px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '14px',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)'
                    }}>
                      <Clock size={18} />
                      <span>Gameplay Unlocks on {new Date(tournament.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenSnakeGame(tournament.id)}
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '15px',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
                        cursor: 'pointer'
                      }}
                    >
                      <Gamepad2 size={20} />
                      <span>Play Snake II Arcade Arena</span>
                    </button>
                  )}

                  <button
                    onClick={scrollToLeaderboard}
                    style={{
                      background: '#ffffff',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trophy size={16} />
                    <span>View Leaderboard</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE - NOT JOINED YET: Gift Selection + Address + CTA */
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Gift size={20} color="#0284c7" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                    Select Your Guaranteed Apparel Gift (Pick 1 of 3):
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                  Every participant receives their chosen apparel delivered home via express BlueDart courier:
                </p>

                {/* Gift Cards Radio Picker */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                  marginBottom: '18px'
                }}>
                  {activeGifts.map((gift) => {
                    const isSelected = selectedGift?.id === gift.id;
                    return (
                      <div
                        key={gift.id}
                        onClick={() => setSelectedGiftId(gift.id)}
                        style={{
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '10px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#0284c7',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                        <div style={{
                          width: '100%',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          marginBottom: '8px'
                        }}>
                          <img
                            src={gift.image_url}
                            alt={gift.category}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                          {gift.category}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through' }}>
                          ₹{Number(gift.market_value).toLocaleString('en-IN')}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          marginTop: '4px'
                        }}>
                          FREE
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Size Selector */}
                {selectedGift?.options?.sizes && selectedGift.options.sizes.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                      Select Size for {selectedGift.category}:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedGift.options.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          style={{
                            minWidth: '42px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: selectedSize === sz ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: selectedSize === sz ? '#0284c7' : '#ffffff',
                            color: selectedSize === sz ? '#ffffff' : '#334155',
                            transition: 'all 0.15s'
                          }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {selectedGift?.options?.colors && selectedGift.options.colors.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                      Select Color Shade:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedGift.options.colors.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: selectedColor === col ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: selectedColor === col ? '#f0f9ff' : '#ffffff',
                            color: selectedColor === col ? '#0284c7' : '#334155',
                          }}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guaranteed Delivery Address Section - Fetched from User Profile */}
                {!user ? (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1.5px dashed #cbd5e1', marginBottom: '20px', textAlign: 'center' }}>
                    <MapPin size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                      Sign In to View Delivery Address
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                      Guaranteed apparel delivery address will be retrieved automatically from your account profile.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenAuth('login')}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : isProfileMissing ? (
                  /* Profile Address is EMPTY or INCOMPLETE - Show prominent validation & action */
                  <div style={{
                    background: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} color="#e11d48" />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#9f1239' }}>
                          Guaranteed Delivery Address:
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '800', background: '#ffe4e6', color: '#e11d48', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #fecdd3' }}>
                          ⚠️ Missing in Profile
                        </span>
                      </div>
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={() => onOpenProfile('address')}
                          style={{
                            background: '#e11d48',
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
                            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)'
                          }}
                        >
                          <Edit2 size={12} />
                          <span>+ Add Address in Profile</span>
                        </button>
                      )}
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecdd3', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#be123c', fontWeight: '600', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertCircle size={16} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>Delivery address profile-il illai.</strong> Address profile-il irunthu edukkappadum — Please click <strong>"+ Add Address in Profile"</strong> to save your delivery address and join the challenge.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="Recipient Full Name"
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: shippingName ? '1px solid #cbd5e1' : '1.5px solid #fca5a5', background: '#ffffff', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Phone / Mobile Number *"
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: shippingPhone ? '1px solid #cbd5e1' : '1.5px solid #fca5a5', background: '#ffffff', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="House / Flat / Street Address * (Empty in profile)"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: shippingAddress ? '1px solid #cbd5e1' : '1.5px solid #fca5a5', background: '#ffffff', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="City *"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: shippingCity ? '1px solid #cbd5e1' : '1.5px solid #fca5a5', background: '#ffffff', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="6-Digit Pincode *"
                          value={shippingPincode}
                          onChange={(e) => setShippingPincode(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: shippingPincode ? '1px solid #cbd5e1' : '1.5px solid #fca5a5', background: '#ffffff', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    {formError && (
                      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={14} />
                        <span>{formError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Profile Address is PRESENT - Display verified profile address with edit button */
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={16} color="#0284c7" />
                        <span>Guaranteed Delivery Address:</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                          ✓ Taken from Profile
                        </span>
                      </div>
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={() => onOpenProfile('address')}
                          style={{
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            color: '#0284c7',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit in Profile</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="Recipient Full Name"
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Phone / Mobile Number"
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="House / Flat / Street Address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <input
                          type="text"
                          placeholder="City"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="6-Digit Pincode"
                          value={shippingPincode}
                          onChange={(e) => setShippingPincode(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <span>Address retrieved from your profile. Shipped via express BlueDart courier.</span>
                    </div>

                    {formError && (
                      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                        {formError}
                      </div>
                    )}
                  </div>
                )}

                {/* Contest Progress & Join CTA */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#0369a1', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      <span>5-Day Skill Contest Active</span>
                    </div>
                    <span>{tournament.slots_filled || 280} / {tournament.total_slots || 500} filled</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.round(((tournament.slots_filled || 280) / (tournament.total_slots || 500)) * 100))}%`,
                      height: '100%',
                      background: '#0284c7'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleJoinClick}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      background: isUpcoming 
                        ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' 
                        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '15px',
                      padding: '16px 24px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isUpcoming 
                        ? '0 8px 20px -4px rgba(124, 58, 237, 0.45)' 
                        : '0 8px 20px -4px rgba(2, 132, 199, 0.45)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{isUpcoming ? 'Pre-Register For Challenge' : 'Join Challenge'} (₹{Number(tournament.entry_fee).toLocaleString('en-IN')})</span>
                    <ChevronRight size={18} />
                  </button>

                  <button
                    onClick={scrollToLeaderboard}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: '700',
                      fontSize: '13px',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trophy size={16} color="#d97706" />
                    <span>View Leaderboard</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM TABS SECTION matching Screenshot 2 */}
        {/* LIVE OFFICIAL LEADERBOARD SECTION */}
        <div id="official-leaderboard-section" style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            background: '#fafafa',
            padding: '0 24px'
          }}>
            <div style={{
              padding: '16px 4px',
              fontWeight: '800',
              fontSize: '15px',
              color: '#0284c7',
              borderBottom: '3px solid #0284c7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Trophy size={16} />
              <span>{isConcluded ? 'Official Certified Final Leaderboard (Winner Declared)' : 'Live Official Leaderboard'}</span>
            </div>
          </div>

          {/* Leaderboard Content */}
          <div style={{ padding: '24px' }}>
            <div>
                {/* User Personal Standing Card */}
                {hasJoined ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #0b1120 0%, #1e293b 100%)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    color: '#ffffff',
                    marginBottom: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 24px -4px rgba(11, 17, 32, 0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}>
                          Your Verified Standing
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Nokia Snake II Official Challenge
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>High Score</div>
                          <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8' }}>
                            {userEntry?.high_score !== undefined ? `${userEntry.high_score} pts` : '0 pts'}
                          </div>
                        </div>
                        <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Current Rank</div>
                          <div style={{ fontSize: '26px', fontWeight: '900', color: userRank === 1 ? '#fbbf24' : '#ffffff' }}>
                            {userRank ? `#${userRank}` : '—'}
                          </div>
                        </div>
                        <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Games Played</div>
                          <div style={{ fontSize: '22px', fontWeight: '800', color: '#cbd5e1' }}>
                            {userEntry?.games_played || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isUpcoming ? (
                      <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Clock size={16} />
                        <span>Contest Opens Soon</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenSnakeGame(tournament.id)}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                        }}
                      >
                        <Gamepad2 size={18} />
                        Play & Improve Score
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        {isUpcoming ? 'Pre-Register to Compete on this Leaderboard' : 'Compete on this Leaderboard'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {isUpcoming
                          ? `Pre-register for ₹${Number(tournament.entry_fee).toLocaleString('en-IN')} to lock in guaranteed apparel. Play opens on ${new Date(tournament.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}!`
                          : `Join this challenge for ₹${Number(tournament.entry_fee).toLocaleString('en-IN')} to play Nokia Snake II and record your high score!`}
                      </div>
                    </div>
                    <button
                      onClick={handleJoinClick}
                      style={{
                        background: isUpcoming ? '#7c3aed' : '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {isUpcoming ? 'Pre-Register Now' : 'Join Challenge Now'}
                    </button>
                  </div>
                )}

                {/* Leaderboard Table Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Tournament Official Standings
                    </h3>
                    <span style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}>
                      {leaderboard.length} Ranked
                    </span>
                  </div>

                  <button
                    onClick={fetchLeaderboard}
                    disabled={loadingLeaderboard}
                    title="Refresh live leaderboard"
                    style={{
                      background: '#f8fafc',
                      color: '#0284c7',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: loadingLeaderboard ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <RotateCw size={13} style={{ animation: loadingLeaderboard ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{loadingLeaderboard ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>

                {/* Leaderboard Table */}
                {loadingLeaderboard && leaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                    Loading official tournament standings...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1'
                  }}>
                    <Trophy size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                      No Scores Submitted Yet
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                      Be the very first player to participate and claim Rank #1!
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '12px 14px' }}>Rank</th>
                          <th style={{ padding: '12px 14px' }}>Participant</th>
                          <th style={{ padding: '12px 14px' }}>Location</th>
                          <th style={{ padding: '12px 14px' }}>Attempts</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>High Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => {
                          const isCurrentUser = user && (entry.user_id === user.id || entry.player_name === user.name);
                          const rank = entry.rank || index + 1;
                          const isRank1 = rank === 1;

                          return (
                            <tr
                              key={entry.id || entry.user_id || index}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: isCurrentUser ? '#fefce8' : isRank1 ? '#fffdf0' : '#ffffff',
                                borderLeft: isCurrentUser ? '4px solid #f59e0b' : 'none',
                                fontWeight: isCurrentUser ? '700' : 'normal'
                              }}
                            >
                              <td style={{ padding: '12px 14px' }}>
                                {isRank1 ? (
                                  <span style={{ fontWeight: '900', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    👑 #1
                                  </span>
                                ) : rank === 2 ? (
                                  <span style={{ fontWeight: '800', color: '#64748b' }}>🥈 #2</span>
                                ) : rank === 3 ? (
                                  <span style={{ fontWeight: '800', color: '#92400e' }}>🥉 #3</span>
                                ) : (
                                  <span style={{ color: '#64748b', fontWeight: '600' }}>#{rank}</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: isCurrentUser ? '800' : '600', color: '#0f172a' }}>
                                    {entry.player_name || 'Anonymous Player'}
                                  </span>
                                  {isConcluded && isRank1 && (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                      color: '#ffffff',
                                      fontSize: '10px',
                                      fontWeight: '900',
                                      padding: '2px 8px',
                                      borderRadius: '9999px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                                    }}>
                                      👑 GRAND PRIZE WINNER
                                    </span>
                                  )}
                                  {isCurrentUser && (
                                    <span style={{
                                      background: '#0284c7',
                                      color: '#ffffff',
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      textTransform: 'uppercase'
                                    }}>
                                      YOU
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', color: '#64748b' }}>
                                {entry.city || 'Tamil Nadu'}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>
                                {entry.games_played ? `${entry.games_played} played` : '1 played'}
                              </td>
                              <td style={{
                                padding: '12px 14px',
                                textAlign: 'right',
                                fontWeight: '900',
                                color: isRank1 ? '#0284c7' : '#0f172a',
                                fontSize: isRank1 ? '15px' : '14px'
                              }}>
                                {Number(entry.high_score || 0).toLocaleString()} pts
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
      </div>

      {/* Sticky Bottom Action Controller for Mobile Screens */}
      <div
        className="mobile-details-sticky-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'none',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 998,
          boxShadow: '0 -4px 15px rgba(0,0,0,0.08)'
        }}
      >
        <div>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
            {hasJoined ? 'Enrolled Player' : 'Guaranteed Gift Incl.'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
            ₹{Number(tournament.entry_fee).toLocaleString('en-IN')}
          </div>
        </div>

        <div>
          {isConcluded ? (
            <button
              onClick={onOpenLeaderboard}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: '800',
                fontSize: '13px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1'
              }}
            >
              View Winners
            </button>
          ) : hasJoined ? (
            isUpcoming ? (
              <div style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '12px',
                padding: '10px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={15} />
                <span>Starts {new Date(tournament.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            ) : (
              <button
                onClick={() => onOpenSnakeGame(tournament.id)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Gamepad2 size={16} />
                <span>Play Snake II</span>
              </button>
            )
          ) : (
            <button
              onClick={handleJoinClick}
              style={{
                background: isUpcoming 
                  ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' 
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '13px',
                padding: '12px 20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isUpcoming 
                  ? '0 4px 14px rgba(124, 58, 237, 0.4)' 
                  : '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <span>{isUpcoming ? 'Pre-Register' : 'Join Challenge'}</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .product-details-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 768px) {
          .mobile-details-sticky-bar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
