import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Shield, Trophy, Gift, Gamepad2, Package, Users, 
  DollarSign, Check, Plus, Edit, Trash2, Award, RefreshCw, Save, AlertCircle, Star,
  Search, Filter, Calendar, Clock, Power, RotateCcw, SlidersHorizontal,
  LayoutDashboard, Truck, LogOut, Menu, ChevronRight,
  Info, ChevronDown, ChevronUp, Lock, CheckCircle2, XCircle, HelpCircle,
  UploadCloud, Image as ImageIcon, Link as LinkIcon,
  Settings, ShoppingBag, Crown, Zap, Target, Flame, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import CompetitionParticipantsView from './CompetitionParticipantsView';
import AppSettingsView from './AppSettingsView';

const toLocalDatetimeInput = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AdminPortalModal({ 
  user, 
  onClose, 
  onRefreshData,
  appSettings,
  onUpdateAppSettings 
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(appSettings || null);

  useEffect(() => {
    if (appSettings) setCurrentSettings(appSettings);
  }, [appSettings]);

  const [overviewStats, setOverviewStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [gameSettings, setGameSettings] = useState({
    base_speed: 110,
    min_speed: 40,
    acceleration_step: 3,
    golden_apple_chance: 0.25,
    golden_apple_points: 50,
    normal_apple_points: 10,
    golden_apple_duration_sec: 7,
    board_size: 20
  });

  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);

  // Challenge edit state
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingGift, setEditingGift] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  // Prize image upload states
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' or 'url'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Guaranteed Gift image upload states
  const [giftImageInputMode, setGiftImageInputMode] = useState('upload'); // 'upload' or 'url'
  const [isUploadingGiftImage, setIsUploadingGiftImage] = useState(false);
  const [isGiftDragging, setIsGiftDragging] = useState(false);
  const giftFileInputRef = useRef(null);

  // Competition Participants State
  const [selectedCompForParticipants, setSelectedCompForParticipants] = useState('ALL');

  // Tournament Filters & Search State
  const [challengeSearch, setChallengeSearch] = useState('');
  const [challengeStatusFilter, setChallengeStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE', 'CONCLUDED'
  const [challengeTimeFilter, setChallengeTimeFilter] = useState('ALL'); // 'ALL', 'WEEK', 'MONTH', 'CUSTOM'
  const [challengeStartDate, setChallengeStartDate] = useState('');
  const [challengeEndDate, setChallengeEndDate] = useState('');
  const [challengeSortBy, setChallengeSortBy] = useState('NEWEST'); // 'NEWEST', 'OLDEST', 'NAME_ASC', 'SLOTS_DESC'

  // Guaranteed Gift Filters & Search State
  const [giftSearch, setGiftSearch] = useState('');
  const [giftStatusFilter, setGiftStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE'
  const [giftTimeFilter, setGiftTimeFilter] = useState('ALL'); // 'ALL', 'WEEK', 'MONTH', 'CUSTOM'
  const [giftStartDate, setGiftStartDate] = useState('');
  const [giftEndDate, setGiftEndDate] = useState('');
  const [giftCategoryFilter, setGiftCategoryFilter] = useState('ALL');
  const [giftSortBy, setGiftSortBy] = useState('DEFAULT'); // 'DEFAULT', 'NEWEST', 'OLDEST', 'NAME_ASC', 'PRICE_DESC'

  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [previewSelectedSize, setPreviewSelectedSize] = useState('');
  const [previewSelectedColor, setPreviewSelectedColor] = useState('');

  // Logistics & Dispatches Filters & Search State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL'); // 'ALL', 'ORDER_PLACED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'
  const [orderChallengeFilter, setOrderChallengeFilter] = useState('ALL'); // 'ALL' or tournament_id
  const [quickDispatchOrder, setQuickDispatchOrder] = useState(null); // Quick dispatch modal order

  // Users & RBAC Guide State
  const [showRbacGuide, setShowRbacGuide] = useState(false);
  const [rbacGuideTab, setRbacGuideTab] = useState('cards'); // 'cards' | 'matrix'
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userAccountStatusFilter, setUserAccountStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'BLOCKED'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleModal, setSelectedRoleModal] = useState(null);
  const [showAdvancedGameSettings, setShowAdvancedGameSettings] = useState(false);


  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdmin = isSuperAdmin || user?.role === 'Admin';
  const isManager = isAdmin || user?.role === 'Manager';
  const isAccountant = isSuperAdmin || user?.role === 'Accountant' || user?.role === 'Admin';
  const isSupport = isManager || user?.role === 'Support';

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.admin.getOverview();
        if (res.success) setOverviewStats(res);
      } else if (activeTab === 'tournaments') {
        const res = await api.tournaments.getAll({ includeInactive: true });
        if (res.success) setTournaments(res.tournaments);
      } else if (activeTab === 'gifts') {
        const res = await api.gifts.getAllAdmin();
        if (res.success) setGifts(res.gifts);
      } else if (activeTab === 'orders') {
        const res = await api.orders.getAllAdmin();
        if (res.success) setOrders(res.orders);
        if (tournaments.length === 0) {
          const tRes = await api.tournaments.getAll({ includeInactive: true });
          if (tRes.success) setTournaments(tRes.tournaments);
        }
      } else if (activeTab === 'game') {
        const res = await api.game.getSettings();
        if (res.success && res.settings) setGameSettings(res.settings);
      } else if (activeTab === 'users' && isAdmin) {
        const res = await api.admin.getUsers();
        if (res.success) setUsersList(res.users);
      } else if (activeTab === 'financials' && isAccountant) {
        const res = await api.admin.getFinancials();
        if (res.success) setFinancials(res);
      }
    } catch (err) {
      console.error(err);
      notify(err.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Handle Save Game Settings
  const handleSaveGameSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateGameSettings(gameSettings);
      if (res.success) {
        notify('✅ Snake II Arcade mechanics dynamically updated in PostgreSQL database!');
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Declare Winner
  const handleDeclareWinner = async (tournamentId) => {
    if (!window.confirm('Declare the #1 player on the live leaderboard as Grand Prize Champion and conclude this tournament?')) {
      return;
    }
    try {
      const res = await api.tournaments.declareWinner(tournamentId);
      if (res.success) {
        notify(`👑 Champion Declared: ${res.tournament.winner_name}`);
        loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Update User Role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.admin.updateUserRole(userId, newRole);
      if (res.success) {
        notify(`✅ User role updated to ${newRole}`);
        loadData();
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Toggle Single User Block / Unblock
  const handleToggleBlockUser = async (targetUser, blockStatus, reason = '') => {
    if (targetUser.id === user?.id) {
      notify('❌ Security Restriction: You cannot block your own administrator account');
      return;
    }
    try {
      const res = await api.admin.toggleBlockUser(targetUser.id, blockStatus, reason);
      if (res.success) {
        notify(res.message || `User ${blockStatus ? 'blocked' : 'unblocked'} successfully`);
        setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_blocked: blockStatus, blocked_reason: reason } : u));
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Multi-Select Bulk Block / Unblock
  const handleBulkBlockUsers = async (blockStatus, reason = '') => {
    if (selectedUserIds.length === 0) {
      notify('❌ Please select at least one user from the list');
      return;
    }

    // Safety: ensure current admin ID is filtered out
    const validIds = selectedUserIds.filter(id => id !== user?.id);
    if (validIds.length === 0) {
      notify('❌ Security Restriction: You cannot block your own account');
      return;
    }

    try {
      const res = await api.admin.bulkBlockUsers(validIds, blockStatus, reason);
      if (res.success) {
        notify(`✅ ${res.message || (blockStatus ? 'Selected users blocked' : 'Selected users unblocked')}`);
        setUsersList(prev => prev.map(u => validIds.includes(u.id) ? { ...u, is_blocked: blockStatus, blocked_reason: reason } : u));
        setSelectedUserIds([]);
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Selection handlers
  const handleSelectUser = (userId) => {
    if (userId === user?.id) return; // Prevent selecting self
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (filteredList) => {
    const selectable = filteredList.filter(u => u.id !== user?.id).map(u => u.id);
    if (selectedUserIds.length === selectable.length && selectable.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectable);
    }
  };


  // Handle Save Tournament Edit
  const handleSaveTournament = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editingTournament };
      const days = payload.duration_days ? parseInt(payload.duration_days, 10) : 5;
      payload.duration_days = days;
      const startTime = payload.start_time ? new Date(payload.start_time) : new Date();
      payload.start_time = startTime.toISOString();
      if (!payload.end_time) {
        payload.end_time = new Date(startTime.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      } else {
        payload.end_time = new Date(payload.end_time).toISOString();
      }
      payload.banner_tag = `${days}-Day Skill Mega Challenge`;

      if (payload.id) {
        await api.tournaments.update(payload.id, payload);
        notify('✅ Tournament challenge updated successfully in DB!');
      } else {
        await api.tournaments.create(payload);
        notify('✅ New tournament challenge created in DB!');
      }
      setEditingTournament(null);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle setting a challenge as Homepage Hero featured
  const handleSetFeatured = async (tournamentId) => {
    try {
      const res = await api.tournaments.setFeatured(tournamentId);
      if (res.success) {
        notify(`⭐ "${res.tournament.title}" is now featured on the Homepage Hero!`);
        await loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Toggle Challenge Active / Inactive
  const handleToggleTournamentStatus = async (tournament) => {
    const nextStatus = tournament.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.tournaments.updateStatus(tournament.id, nextStatus);
      if (res.success) {
        notify(
          nextStatus === 'ACTIVE'
            ? `🟢 Challenge "${tournament.title}" is now ACTIVE & open for players!`
            : `⏸️ Challenge "${tournament.title}" has been DEACTIVATED (Inactive)!`
        );
        await loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Prize Image File Upload
  const handleImageUploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('❌ Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('❌ Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const res = await api.admin.uploadImage({
            image: base64,
            filename: file.name
          });
          if (res.success && res.url) {
            setEditingTournament((prev) => ({ ...prev, image_url: res.url }));
            notify('✅ Prize image uploaded successfully from your device!');
          } else {
            setEditingTournament((prev) => ({ ...prev, image_url: base64 }));
            notify('✅ Prize image attached successfully!');
          }
        } catch (err) {
          // Graceful fallback to Data URI so user can always proceed even without backend connection
          setEditingTournament((prev) => ({ ...prev, image_url: reader.result }));
          notify('✅ Image attached from your computer!');
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.onerror = () => {
        notify('❌ Failed to read file from disk');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      notify(`❌ ${err.message}`);
      setIsUploadingImage(false);
    }
  };

  // Handle Guaranteed Gift Image File Upload
  const handleGiftImageUploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('❌ Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('❌ Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploadingGiftImage(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const res = await api.admin.uploadImage({
            image: base64,
            filename: file.name
          });
          if (res.success && res.url) {
            setEditingGift((prev) => ({ ...prev, image_url: res.url }));
            notify('✅ Apparel product image uploaded successfully from your device!');
          } else {
            setEditingGift((prev) => ({ ...prev, image_url: base64 }));
            notify('✅ Apparel product image attached successfully!');
          }
        } catch (err) {
          // Graceful fallback to Data URI
          setEditingGift((prev) => ({ ...prev, image_url: reader.result }));
          notify('✅ Image attached from your computer!');
        } finally {
          setIsUploadingGiftImage(false);
        }
      };
      reader.onerror = () => {
        notify('❌ Failed to read file from disk');
        setIsUploadingGiftImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      notify(`❌ ${err.message}`);
      setIsUploadingGiftImage(false);
    }
  };

  // Reset challenge filters
  const handleResetChallengeFilters = () => {
    setChallengeSearch('');
    setChallengeStatusFilter('ALL');
    setChallengeTimeFilter('ALL');
    setChallengeStartDate('');
    setChallengeEndDate('');
    setChallengeSortBy('NEWEST');
  };

  // Handle Toggle Gift Active / Inactive
  const handleToggleGiftStatus = async (gift) => {
    const nextStatus = !gift.is_active;
    try {
      const res = await api.gifts.updateStatus(gift.id, nextStatus);
      if (res.success) {
        notify(
          nextStatus
            ? `🟢 Gift "${gift.name}" is now ACTIVE & visible to players!`
            : `⏸️ Gift "${gift.name}" has been DEACTIVATED (Inactive & hidden from users)!`
        );
        await loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Reset gift filters
  const handleResetGiftFilters = () => {
    setGiftSearch('');
    setGiftStatusFilter('ALL');
    setGiftTimeFilter('ALL');
    setGiftStartDate('');
    setGiftEndDate('');
    setGiftCategoryFilter('ALL');
    setGiftSortBy('DEFAULT');
  };

  // Helper to initialize editing a gift with options
  const startEditGift = (g) => {
    let opts = g.options;
    if (typeof opts === 'string') {
      try { opts = JSON.parse(opts); } catch (e) { opts = {}; }
    }
    const sizesArr = Array.isArray(opts?.sizes) && opts.sizes.length > 0 ? opts.sizes : ['Free Size'];
    const colorsArr = Array.isArray(opts?.colors) && opts.colors.length > 0 ? opts.colors : ['Standard'];

    setEditingGift({
      ...g,
      options: opts,
      stock: g.stock !== undefined ? g.stock : 500,
      is_active: g.is_active !== false,
      sizes: sizesArr,
      colors: colorsArr,
      sizesText: sizesArr.join(', '),
      colorsText: colorsArr.join(', ')
    });
    setGiftImageInputMode(g.image_url && g.image_url.startsWith('http') && !g.image_url.includes('/uploads/') ? 'url' : 'upload');
    setPreviewSelectedSize(sizesArr[0] || 'M');
    setPreviewSelectedColor(colorsArr[0] || 'Standard');
    setCustomSizeInput('');
    setCustomColorInput('');
  };

  const startAddGift = () => {
    const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const defaultColors = ['Charcoal Black', 'Vintage Off-White', 'Midnight Navy'];
    setEditingGift({
      name: '',
      category: 'T-Shirt',
      tagline: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      market_value: 1499,
      stock: 500,
      is_active: true,
      sizes: defaultSizes,
      colors: defaultColors,
      sizesText: defaultSizes.join(', '),
      colorsText: defaultColors.join(', '),
      options: { sizes: defaultSizes, colors: defaultColors }
    });
    setGiftImageInputMode('upload');
    setPreviewSelectedSize('S');
    setPreviewSelectedColor('Charcoal Black');
    setCustomSizeInput('');
    setCustomColorInput('');
  };

  // Add/remove available sizes
  const handleAddSize = (sz) => {
    const trimmed = (sz || '').trim();
    if (!trimmed || !editingGift) return;
    const current = editingGift.sizes || (editingGift.sizesText ? editingGift.sizesText.split(',').map(s => s.trim()).filter(Boolean) : []);
    if (!current.includes(trimmed)) {
      const nextSizes = [...current, trimmed];
      setEditingGift({
        ...editingGift,
        sizes: nextSizes,
        sizesText: nextSizes.join(', ')
      });
      if (!previewSelectedSize) setPreviewSelectedSize(trimmed);
    }
    setCustomSizeInput('');
  };

  const handleRemoveSize = (sz) => {
    if (!editingGift) return;
    const current = editingGift.sizes || (editingGift.sizesText ? editingGift.sizesText.split(',').map(s => s.trim()).filter(Boolean) : []);
    const nextSizes = current.filter((s) => s !== sz);
    setEditingGift({
      ...editingGift,
      sizes: nextSizes,
      sizesText: nextSizes.join(', ')
    });
    if (previewSelectedSize === sz && nextSizes.length > 0) {
      setPreviewSelectedSize(nextSizes[0]);
    }
  };

  // Add/remove available colors
  const handleAddColor = (col) => {
    const trimmed = (col || '').trim();
    if (!trimmed || !editingGift) return;
    const current = editingGift.colors || (editingGift.colorsText ? editingGift.colorsText.split(',').map(c => c.trim()).filter(Boolean) : []);
    if (!current.includes(trimmed)) {
      const nextColors = [...current, trimmed];
      setEditingGift({
        ...editingGift,
        colors: nextColors,
        colorsText: nextColors.join(', ')
      });
      if (!previewSelectedColor) setPreviewSelectedColor(trimmed);
    }
    setCustomColorInput('');
  };

  const handleRemoveColor = (col) => {
    if (!editingGift) return;
    const current = editingGift.colors || (editingGift.colorsText ? editingGift.colorsText.split(',').map(c => c.trim()).filter(Boolean) : []);
    const nextColors = current.filter((c) => c !== col);
    setEditingGift({
      ...editingGift,
      colors: nextColors,
      colorsText: nextColors.join(', ')
    });
    if (previewSelectedColor === col && nextColors.length > 0) {
      setPreviewSelectedColor(nextColors[0]);
    }
  };

  // Handle Save Gift Edit
  const handleSaveGift = async (e) => {
    e.preventDefault();
    try {
      if (!editingGift.image_url) {
        notify('❌ Please upload an image or provide an image URL for the apparel gift');
        return;
      }
      const parsedSizes = editingGift.sizes && editingGift.sizes.length > 0
        ? editingGift.sizes
        : (editingGift.sizesText ? editingGift.sizesText.split(',').map((s) => s.trim()).filter(Boolean) : ['Free Size']);

      const parsedColors = editingGift.colors && editingGift.colors.length > 0
        ? editingGift.colors
        : (editingGift.colorsText ? editingGift.colorsText.split(',').map((c) => c.trim()).filter(Boolean) : ['Standard']);

      const payload = {
        name: editingGift.name,
        category: editingGift.category,
        tagline: editingGift.tagline,
        description: editingGift.description || editingGift.tagline,
        image_url: editingGift.image_url,
        market_value: parseFloat(editingGift.market_value) || 1499.00,
        stock: parseInt(editingGift.stock, 10) || 500,
        is_active: editingGift.is_active !== undefined ? editingGift.is_active : true,
        options: {
          sizes: parsedSizes.length > 0 ? parsedSizes : ['Free Size'],
          colors: parsedColors.length > 0 ? parsedColors : ['Standard']
        }
      };

      if (editingGift.id) {
        await api.gifts.update(editingGift.id, payload);
        notify('✅ Guaranteed gift and available options updated in PostgreSQL DB!');
      } else {
        await api.gifts.create(payload);
        notify('✅ New guaranteed gift created with custom options in PostgreSQL DB!');
      }
      setEditingGift(null);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Handle Update Order Fulfillment Status
  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    try {
      await api.orders.updateStatus(editingOrder.id, {
        fulfillment_status: editingOrder.fulfillment_status,
        courier_partner: editingOrder.courier_partner,
        tracking_number: editingOrder.tracking_number,
        note: editingOrder.note || `Status updated to ${editingOrder.fulfillment_status}`
      });
      notify('✅ Logistics fulfillment and tracking updated!');
      setEditingOrder(null);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Direct inline/quick order status update
  const handleDirectOrderStatusChange = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      await api.orders.updateStatus(orderId, {
        fulfillment_status: newStatus,
        courier_partner: order.courier_partner || 'BlueDart Express',
        tracking_number: order.tracking_number || `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`,
        note: `Logistics status updated to ${newStatus}`
      });
      notify(`✅ Order #${order.order_number} status updated to ${newStatus}!`);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  // Submit quick courier dispatch modal
  const handleQuickDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!quickDispatchOrder) return;
    try {
      await api.orders.updateStatus(quickDispatchOrder.id, {
        fulfillment_status: 'DISPATCHED',
        courier_partner: quickDispatchOrder.courier_partner || 'BlueDart Express',
        tracking_number: quickDispatchOrder.tracking_number || `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`,
        note: quickDispatchOrder.note || `Package couriered via ${quickDispatchOrder.courier_partner || 'BlueDart Express'}. In transit.`
      });
      notify(`🚚 Order #${quickDispatchOrder.order_number} marked as Couriered & Dispatched!`);
      setQuickDispatchOrder(null);
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      notify(`❌ ${err.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 17, 32, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="admin-portal-shell" style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '1540px',
        width: '98vw',
        height: '93vh',
        boxShadow: '0 30px 80px -15px rgba(0,0,0,0.45)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(11, 17, 32, 0.7)',
              zIndex: 49,
              backdropFilter: 'blur(3px)'
            }}
          />
        )}

        {/* ========================================================
            LEFT SIDEBAR NAVIGATION (Web App Dashboard Menu)
           ======================================================== */}
        <aside className={`admin-portal-sidebar ${mobileSidebarOpen ? 'open' : ''}`} style={{
          width: '270px',
          minWidth: '270px',
          background: 'linear-gradient(180deg, #0b1120 0%, #0f172a 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          zIndex: 50,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%'
        }}>
          {/* Brand Header */}
          <div style={{
            padding: '20px 20px 16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {currentSettings?.logo_url ? (
                <img
                  src={currentSettings.logo_url}
                  alt={currentSettings.admin_header_title || 'Logo'}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                    background: '#ffffff',
                    padding: '3px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}>
                  {currentSettings?.logo_icon === 'ShoppingBag' ? <ShoppingBag size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Trophy' ? <Trophy size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Gamepad2' ? <Gamepad2 size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Crown' ? <Crown size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Sparkles' ? <Sparkles size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Zap' ? <Zap size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Target' ? <Target size={22} color="#ffffff" /> :
                   currentSettings?.logo_icon === 'Flame' ? <Flame size={22} color="#ffffff" /> :
                   <Shield size={22} color="#ffffff" />}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {currentSettings?.admin_header_title || currentSettings?.app_name || 'WinArena'}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    {currentSettings?.admin_header_badge || 'CONTROL'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {currentSettings?.admin_header_subtitle || 'Operations & Ops Console'}
                </div>
              </div>
            </div>


            {/* Mobile close button */}
            <button
              className="admin-sidebar-mobile-close"
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'none'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Admin User Profile Card */}
          <div style={{
            margin: '14px 14px 8px 14px',
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '800',
              color: '#38bdf8',
              flexShrink: 0
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.name || 'Administrator'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px #22c55e'
                }} />
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items (Scrollable) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* GROUP 1: ARENA & OPERATIONS */}
            <div>
              <div style={{
                padding: '0 10px 8px 10px',
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b'
              }}>
                Arena & Operations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 1. Dashboard */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: activeTab === 'overview' ? '700' : '600',
                    color: activeTab === 'overview' ? '#ffffff' : '#94a3b8',
                    background: activeTab === 'overview' 
                      ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                      : 'transparent',
                    borderLeft: activeTab === 'overview' ? '4px solid #38bdf8' : '4px solid transparent',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (activeTab !== 'overview') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== 'overview') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutDashboard size={17} color={activeTab === 'overview' ? '#38bdf8' : '#64748b'} />
                    <span>Dashboard</span>
                  </div>
                </button>

                {/* 2. Challenges & Slots */}
                {isManager && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('tournaments'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'tournaments' ? '700' : '600',
                      color: activeTab === 'tournaments' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'tournaments' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'tournaments' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'tournaments') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'tournaments') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Trophy size={17} color={activeTab === 'tournaments' ? '#38bdf8' : '#64748b'} />
                      <span>Challenges & Slots</span>
                    </div>
                  </button>
                )}

                {/* 3. Joined Contestants by Competition */}
                {isManager && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompForParticipants('ALL');
                      setActiveTab('participants');
                      setMobileSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'participants' ? '700' : '600',
                      color: activeTab === 'participants' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'participants' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'participants' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'participants') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'participants') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={17} color={activeTab === 'participants' ? '#38bdf8' : '#64748b'} />
                      <span>Joined Contestants</span>
                    </div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      letterSpacing: '0.04em'
                    }}>
                      Live
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* GROUP 2: REWARDS & LOGISTICS */}
            <div>
              <div style={{
                padding: '0 10px 8px 10px',
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b'
              }}>
                Rewards & Logistics
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 4. Guaranteed Apparel Gifts */}
                {isManager && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('gifts'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'gifts' ? '700' : '600',
                      color: activeTab === 'gifts' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'gifts' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'gifts' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'gifts') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'gifts') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Gift size={17} color={activeTab === 'gifts' ? '#38bdf8' : '#64748b'} />
                      <span>Guaranteed Gifts</span>
                    </div>
                  </button>
                )}

                {/* 5. Logistics & Dispatches */}
                {isSupport && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'orders' ? '700' : '600',
                      color: activeTab === 'orders' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'orders' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'orders' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'orders') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'orders') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Truck size={17} color={activeTab === 'orders' ? '#38bdf8' : '#64748b'} />
                      <span>Logistics & Dispatches</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* GROUP 3: SYSTEM CONFIGURATION */}
            <div>
              <div style={{
                padding: '0 10px 8px 10px',
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b'
              }}>
                Platform Config
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 6. Snake Mechanics Config */}
                {isManager && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('game'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'game' ? '700' : '600',
                      color: activeTab === 'game' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'game' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'game' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'game') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'game') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Gamepad2 size={17} color={activeTab === 'game' ? '#38bdf8' : '#64748b'} />
                      <span>Snake Mechanics</span>
                    </div>
                  </button>
                )}

                {/* 7. Users & Roles (RBAC) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('users'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'users' ? '700' : '600',
                      color: activeTab === 'users' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'users' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'users' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'users') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'users') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Shield size={17} color={activeTab === 'users' ? '#38bdf8' : '#64748b'} />
                      <span>Users & Roles (RBAC)</span>
                    </div>
                  </button>
                )}

                {/* 8. Financial Analytics */}
                {isAccountant && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('financials'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'financials' ? '700' : '600',
                      color: activeTab === 'financials' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'financials' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'financials' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'financials') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'financials') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <DollarSign size={17} color={activeTab === 'financials' ? '#38bdf8' : '#64748b'} />
                      <span>Financial Analytics</span>
                    </div>
                  </button>
                )}

                {/* 9. Application Settings & Branding (Super Admin & Admin) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('app_settings'); setMobileSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: activeTab === 'app_settings' ? '700' : '600',
                      color: activeTab === 'app_settings' ? '#ffffff' : '#94a3b8',
                      background: activeTab === 'app_settings' 
                        ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.06) 100%)' 
                        : 'transparent',
                      borderLeft: activeTab === 'app_settings' ? '4px solid #38bdf8' : '4px solid transparent',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (activeTab !== 'app_settings') {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#f1f5f9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeTab !== 'app_settings') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Settings size={17} color={activeTab === 'app_settings' ? '#38bdf8' : '#64748b'} />
                      <span>Application Settings</span>
                    </div>
                    {isSuperAdmin && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        SUPER
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Sidebar Bottom Footer */}
          <div style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#64748b'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }} />
                Database Online
              </span>
              <span style={{ color: '#475569' }}>v2.4.0</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            >
              <LogOut size={15} />
              <span>Exit Admin Portal</span>
            </button>
          </div>
        </aside>

        {/* ========================================================
            RIGHT MAIN PANEL (Top Bar & Dynamic Workspace)
           ======================================================== */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          background: '#f8fafc',
          overflow: 'hidden'
        }}>
          {/* Main Top Header Bar */}
          <header style={{
            height: '66px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                className="admin-mobile-menu-btn"
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                style={{
                  display: 'none',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  padding: '7px 9px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Open Sidebar"
              >
                <Menu size={18} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                  <span>{currentSettings?.admin_header_title || currentSettings?.app_name || 'WinArena'} Console</span>
                  <ChevronRight size={12} color="#94a3b8" />
                  <span style={{ color: '#0284c7' }}>
                    {activeTab === 'overview' && 'Dashboard'}
                    {activeTab === 'tournaments' && 'Challenges & Slots'}
                    {activeTab === 'participants' && 'Joined Contestants'}
                    {activeTab === 'gifts' && 'Guaranteed Gifts'}
                    {activeTab === 'orders' && 'Logistics & Dispatches'}
                    {activeTab === 'game' && 'Snake Mechanics'}
                    {activeTab === 'users' && 'Users & Roles (RBAC)'}
                    {activeTab === 'financials' && 'Financial Analytics'}
                    {activeTab === 'app_settings' && 'Application Settings'}
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {activeTab === 'overview' && 'Executive Overview Dashboard'}
                  {activeTab === 'tournaments' && 'Dynamic Tournament Challenges'}
                  {activeTab === 'participants' && 'Joined Contestants by Competition'}
                  {activeTab === 'gifts' && 'Guaranteed Apparel Gifts'}
                  {activeTab === 'orders' && 'Logistics & Courier Dispatches'}
                  {activeTab === 'game' && 'Snake Mechanics Config'}
                  {activeTab === 'users' && 'User Management & Role-Based Access (RBAC)'}
                  {activeTab === 'financials' && 'Financial Analytics & Revenue Audit'}
                  {activeTab === 'app_settings' && 'Application Settings & Brand Control'}
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  loadData();
                  if (onRefreshData) onRefreshData();
                  notify('✅ Data refreshed successfully');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              >
                <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Close Portal"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Notification Banner */}
          {notification && (
            <div style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
            }}>
              <span>{notification}</span>
              <button
                type="button"
                onClick={() => setNotification('')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab Content Workspace */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && overviewStats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>TOTAL COLLECTIONS</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                    ₹{Number(overviewStats.stats.total_revenue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>ACTIVE TOURNAMENTS</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
                    {overviewStats.stats.active_tournaments}
                  </div>
                </div>
                <div 
                  onClick={() => {
                    setSelectedCompForParticipants('ALL');
                    setActiveTab('participants');
                  }}
                  style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s' }}
                  title="Click to view all joined contestants by competition"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>TOTAL ENTRIES</div>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>View Contestants &rarr;</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                    {overviewStats.stats.total_entries}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>APPAREL DISPATCHES</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#7e22ce', marginTop: '4px' }}>
                    {overviewStats.stats.total_orders}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Recent Deliveries Placed:</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Order No</th>
                      <th style={{ padding: '10px' }}>Recipient</th>
                      <th style={{ padding: '10px' }}>Guaranteed Gift</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewStats.recentOrders?.map((ord, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: '700', color: '#0284c7' }}>{ord.order_number}</td>
                        <td style={{ padding: '10px' }}>{ord.shipping_name}</td>
                        <td style={{ padding: '10px' }}>{ord.gift_name}</td>
                        <td style={{ padding: '10px', fontWeight: '700', color: '#059669' }}>{ord.fulfillment_status}</td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>₹{Number(ord.amount_paid).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TOURNAMENTS (CHALLENGES) */}
          {activeTab === 'tournaments' && (() => {
            // Compute filtered and sorted tournaments
            const filteredTournaments = tournaments.filter((t) => {
              // 1. Name / title search
              if (challengeSearch.trim()) {
                const q = challengeSearch.toLowerCase().trim();
                const matchTitle = (t.title || '').toLowerCase().includes(q);
                const matchCategory = (t.category || '').toLowerCase().includes(q);
                const matchSlug = (t.slug || '').toLowerCase().includes(q);
                if (!matchTitle && !matchCategory && !matchSlug) return false;
              }

              // 2. Status filter
              if (challengeStatusFilter !== 'ALL') {
                if ((t.status || '').toUpperCase() !== challengeStatusFilter) return false;
              }

              // 3. Date / Month / Week filter
              if (challengeTimeFilter !== 'ALL') {
                const itemTime = new Date(t.created_at || t.start_time || Date.now()).getTime();
                const now = Date.now();

                if (challengeTimeFilter === 'WEEK') {
                  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
                  if (itemTime < oneWeekAgo) return false;
                } else if (challengeTimeFilter === 'MONTH') {
                  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
                  if (itemTime < oneMonthAgo) return false;
                } else if (challengeTimeFilter === 'CUSTOM') {
                  if (challengeStartDate) {
                    const start = new Date(challengeStartDate).getTime();
                    if (itemTime < start) return false;
                  }
                  if (challengeEndDate) {
                    const end = new Date(challengeEndDate).getTime() + 24 * 60 * 60 * 1000 - 1;
                    if (itemTime > end) return false;
                  }
                }
              }

              return true;
            }).sort((a, b) => {
              if (challengeSortBy === 'NEWEST') {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
              } else if (challengeSortBy === 'OLDEST') {
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
              } else if (challengeSortBy === 'NAME_ASC') {
                return (a.title || '').localeCompare(b.title || '');
              } else if (challengeSortBy === 'SLOTS_DESC') {
                return (b.slots_filled || 0) - (a.slots_filled || 0);
              }
              return 0;
            });

            const activeTournamentsCount = tournaments.filter(t => t.status === 'ACTIVE').length;
            const inactiveTournamentsCount = tournaments.filter(t => t.status === 'INACTIVE').length;
            const concludedTournamentsCount = tournaments.filter(t => t.status === 'CONCLUDED').length;

            const isChallengeFilterActive = 
              challengeSearch !== '' || 
              challengeStatusFilter !== 'ALL' || 
              challengeTimeFilter !== 'ALL' || 
              challengeStartDate !== '' || 
              challengeEndDate !== '' || 
              challengeSortBy !== 'NEWEST';

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Dynamic Tournament Challenges</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Activate, deactivate, filter, and manage custom-duration skill arenas.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const defaultDays = 5;
                      const now = new Date();
                      const defaultEnd = new Date(now.getTime() + defaultDays * 24 * 60 * 60 * 1000);
                      setEditingTournament({
                        title: '',
                        slug: `challenge-${Date.now()}`,
                        category: 'Smartphones & Flagships',
                        badge_text: 'OFFICIAL PARTNER HUB',
                        banner_tag: `${defaultDays}-Day Skill Mega Challenge`,
                        description: '',
                        entry_fee: 1000,
                        retail_price: 50000,
                        total_slots: 500,
                        duration_days: defaultDays,
                        start_time: now.toISOString(),
                        end_time: defaultEnd.toISOString(),
                        status: 'ACTIVE',
                        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80'
                      });
                    }}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Plus size={16} />
                    <span>Create Challenge</span>
                  </button>
                </div>

                {/* HOMEPAGE HERO FEATURED CHALLENGE CONTROLLER */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '2px solid #0284c7',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.12)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.35)',
                      flexShrink: 0
                    }}>
                      <Star size={24} fill="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                        Homepage Hero Showcase Challenge
                      </div>
                      <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '2px' }}>
                        Currently Displayed: <strong>{tournaments.find(t => t.is_featured)?.title || 'First Active Challenge'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                      Show on Home Page Hero:
                    </span>
                    <select
                      value={tournaments.find(t => t.is_featured)?.id || ''}
                      onChange={(e) => handleSetFeatured(e.target.value)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid #0284c7',
                        background: '#ffffff',
                        fontWeight: '700',
                        fontSize: '13px',
                        color: '#0f172a',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                      }}
                    >
                      {tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.is_featured ? '⭐ [ACTIVE HERO] ' : ''}{t.title} ({t.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* FILTER & SEARCH TOOLBAR (Name, Status, Date / Week / Month) */}
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  {/* Row 1: Search by Name/Title & Status Filters */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    {/* Name Wise Search Input */}
                    <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
                      <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search challenge by name / title..."
                        value={challengeSearch}
                        onChange={(e) => setChallengeSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 34px 9px 36px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          outline: 'none',
                          background: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                      {challengeSearch && (
                        <button
                          type="button"
                          onClick={() => setChallengeSearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>Status:</span>
                      {[
                        { id: 'ALL', label: `All (${tournaments.length})` },
                        { id: 'ACTIVE', label: `Active (${activeTournamentsCount})`, color: '#10b981' },
                        { id: 'INACTIVE', label: `Inactive (${inactiveTournamentsCount})`, color: '#ef4444' },
                        { id: 'CONCLUDED', label: `Concluded (${concludedTournamentsCount})`, color: '#64748b' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setChallengeStatusFilter(st.id)}
                          style={{
                            background: challengeStatusFilter === st.id ? '#0284c7' : '#f1f5f9',
                            color: challengeStatusFilter === st.id ? '#ffffff' : '#334155',
                            border: challengeStatusFilter === st.id ? '1px solid #0284c7' : '1px solid transparent',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {st.color && (
                            <span style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: challengeStatusFilter === st.id ? '#ffffff' : st.color
                            }} />
                          )}
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Date / Month / Week Filter & Sort & Reset */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {/* Timeline filter: Date, Week, Month */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={15} color="#0284c7" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Timeline:</span>
                        <select
                          value={challengeTimeFilter}
                          onChange={(e) => setChallengeTimeFilter(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="ALL">All Time</option>
                          <option value="WEEK">📅 This Week (Last 7 Days)</option>
                          <option value="MONTH">🗓️ This Month (Last 30 Days)</option>
                          <option value="CUSTOM">🎯 Custom Date Range</option>
                        </select>
                      </div>

                      {/* Custom Date Pickers */}
                      {challengeTimeFilter === 'CUSTOM' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="date"
                            value={challengeStartDate}
                            onChange={(e) => setChallengeStartDate(e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '12px',
                              color: '#0f172a',
                              background: '#fff'
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
                          <input
                            type="date"
                            value={challengeEndDate}
                            onChange={(e) => setChallengeEndDate(e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '12px',
                              color: '#0f172a',
                              background: '#fff'
                            }}
                          />
                        </div>
                      )}

                      {/* Sort Order */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Sort:</span>
                        <select
                          value={challengeSortBy}
                          onChange={(e) => setChallengeSortBy(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="NEWEST">Newest First</option>
                          <option value="OLDEST">Oldest First</option>
                          <option value="NAME_ASC">Name (A–Z)</option>
                          <option value="SLOTS_DESC">Most Slots Filled</option>
                        </select>
                      </div>
                    </div>

                    {/* Result Count & Reset Filters Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Showing <strong>{filteredTournaments.length}</strong> of {tournaments.length} Challenges
                      </span>
                      {isChallengeFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetChallengeFilters}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* EDIT / CREATE TOURNAMENT FORM */}
                {editingTournament ? (
                  <form onSubmit={handleSaveTournament} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                        {editingTournament.id ? 'Edit Challenge' : 'Create New Challenge'}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Configure specifications, entry slots, and active availability
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Challenge Title</label>
                        <input
                          type="text"
                          value={editingTournament.title}
                          onChange={(e) => setEditingTournament({ ...editingTournament, title: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Category</label>
                        <input
                          type="text"
                          value={editingTournament.category}
                          onChange={(e) => setEditingTournament({ ...editingTournament, category: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Status</label>
                        <select
                          value={editingTournament.status || 'ACTIVE'}
                          onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #0284c7', background: '#fff', fontWeight: '700' }}
                        >
                          <option value="ACTIVE">🟢 ACTIVE (Open for Play)</option>
                          <option value="INACTIVE">⏸️ INACTIVE (Deactivated / Paused)</option>
                          <option value="CONCLUDED">👑 CONCLUDED (Contest Ended)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Entry Fee (₹)</label>
                        <input
                          type="number"
                          value={editingTournament.entry_fee}
                          onChange={(e) => setEditingTournament({ ...editingTournament, entry_fee: parseFloat(e.target.value) })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Retail Value (₹)</label>
                        <input
                          type="number"
                          value={editingTournament.retail_price}
                          onChange={(e) => setEditingTournament({ ...editingTournament, retail_price: parseFloat(e.target.value) })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Total Slots</label>
                        <input
                          type="number"
                          value={editingTournament.total_slots}
                          onChange={(e) => setEditingTournament({ ...editingTournament, total_slots: parseInt(e.target.value, 10) })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                        />
                      </div>
                    </div>

                    {/* CONTEST SCHEDULE: START DATE, DURATION & DEADLINE */}
                    <div style={{
                      background: '#ffffff',
                      border: '1.5px solid #0284c7',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      marginBottom: '16px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={18} color="#0284c7" />
                          <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            Challenge Schedule & Launch Timing
                          </h4>
                        </div>
                        <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', background: '#e0f2fe', padding: '3px 10px', borderRadius: '6px' }}>
                          Start Date + Duration Controller
                        </span>
                      </div>

                      {/* 1. START DATE & TIME PICKER */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="#0284c7" />
                            <span>1. Start Date & Time (Contest Launch)</span>
                          </label>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {editingTournament.start_time && new Date(editingTournament.start_time).getTime() > Date.now()
                              ? '⏳ Scheduled for future'
                              : '🟢 Starts Immediately'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <input
                              type="datetime-local"
                              value={toLocalDatetimeInput(editingTournament.start_time || new Date())}
                              onChange={(e) => {
                                const newStart = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
                                const days = editingTournament.duration_days ?? 5;
                                const calculatedEnd = new Date(new Date(newStart).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
                                setEditingTournament({
                                  ...editingTournament,
                                  start_time: newStart,
                                  end_time: calculatedEnd
                                });
                              }}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #0284c7',
                                background: '#ffffff',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#0f172a'
                              }}
                              required
                            />
                            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Choose when players can start playing. If future date, shows as <strong>Upcoming Challenge</strong> on Home Page!
                            </span>
                          </div>

                          {/* Quick Start Presets */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                              Quick Start Presets:
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const now = new Date();
                                  const days = editingTournament.duration_days ?? 5;
                                  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
                                  setEditingTournament({
                                    ...editingTournament,
                                    start_time: now.toISOString(),
                                    end_time: end.toISOString()
                                  });
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0f172a',
                                  cursor: 'pointer'
                                }}
                              >
                                🚀 Start Now
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  tomorrow.setHours(9, 0, 0, 0);
                                  const days = editingTournament.duration_days ?? 5;
                                  const end = new Date(tomorrow.getTime() + days * 24 * 60 * 60 * 1000);
                                  setEditingTournament({
                                    ...editingTournament,
                                    start_time: tomorrow.toISOString(),
                                    end_time: end.toISOString()
                                  });
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0f172a',
                                  cursor: 'pointer'
                                }}
                              >
                                📅 Tomorrow 9 AM
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const inThree = new Date();
                                  inThree.setDate(inThree.getDate() + 3);
                                  inThree.setHours(9, 0, 0, 0);
                                  const days = editingTournament.duration_days ?? 5;
                                  const end = new Date(inThree.getTime() + days * 24 * 60 * 60 * 1000);
                                  setEditingTournament({
                                    ...editingTournament,
                                    start_time: inThree.toISOString(),
                                    end_time: end.toISOString()
                                  });
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0f172a',
                                  cursor: 'pointer'
                                }}
                              >
                                ⏳ In 3 Days
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. DURATION (DAYS) CONTROLLER */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '14px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                          2. Challenge Duration (Days from Start Date)
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px', alignItems: 'center' }}>
                          <div>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={editingTournament.duration_days ?? 5}
                                onChange={(e) => {
                                  const days = parseInt(e.target.value, 10) || 1;
                                  const baseStart = editingTournament.start_time ? new Date(editingTournament.start_time) : new Date();
                                  const calculatedEnd = new Date(baseStart.getTime() + days * 24 * 60 * 60 * 1000);
                                  setEditingTournament({
                                    ...editingTournament,
                                    duration_days: days,
                                    end_time: calculatedEnd.toISOString()
                                  });
                                }}
                                style={{
                                  width: '100%',
                                  padding: '9px 12px 9px 38px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #0284c7',
                                  background: '#ffffff',
                                  fontSize: '14px',
                                  fontWeight: '800',
                                  color: '#0f172a'
                                }}
                                required
                              />
                              <Clock size={16} color="#0284c7" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Set how many active days the contest runs
                            </span>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                              Quick Duration Presets:
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {[1, 2, 3, 5, 7, 10, 14, 30].map((presetDays) => {
                                const isSelected = (editingTournament.duration_days ?? 5) === presetDays;
                                return (
                                  <button
                                    key={presetDays}
                                    type="button"
                                    onClick={() => {
                                      const baseStart = editingTournament.start_time ? new Date(editingTournament.start_time) : new Date();
                                      const calculatedEnd = new Date(baseStart.getTime() + presetDays * 24 * 60 * 60 * 1000);
                                      setEditingTournament({
                                        ...editingTournament,
                                        duration_days: presetDays,
                                        end_time: calculatedEnd.toISOString()
                                      });
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                      background: isSelected ? '#0284c7' : '#ffffff',
                                      color: isSelected ? '#ffffff' : '#334155',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {presetDays} {presetDays === 1 ? 'Day' : 'Days'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. END DATE & TIME PICKER (CALCULATED OR CUSTOM) */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={14} color="#059669" />
                            <span>3. End Date & Time (Contest Deadline)</span>
                          </label>
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                            Auto-calculated or Customizable
                          </span>
                        </div>

                        <input
                          type="datetime-local"
                          value={toLocalDatetimeInput(editingTournament.end_time || new Date())}
                          onChange={(e) => {
                            const newEnd = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
                            const baseStart = editingTournament.start_time ? new Date(editingTournament.start_time) : new Date();
                            const diffDays = Math.max(1, Math.round((new Date(newEnd).getTime() - baseStart.getTime()) / (24 * 60 * 60 * 1000)));
                            setEditingTournament({
                              ...editingTournament,
                              end_time: newEnd,
                              duration_days: diffDays
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #10b981',
                            background: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#0f172a'
                          }}
                          required
                        />
                      </div>

                      {/* 4. HOME PAGE STATUS PREVIEW CALLOUT */}
                      {editingTournament.start_time && new Date(editingTournament.start_time).getTime() > Date.now() ? (
                        <div style={{
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                          borderRadius: '10px',
                          border: '1.5px solid #c4b5fd',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#7c3aed',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            ⏳
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#5b21b6' }}>
                              Home Page Display: UPCOMING CHALLENGES
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#6d28d9', marginTop: '2px', lineHeight: 1.4 }}>
                              Contest opens on <strong>{new Date(editingTournament.start_time).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>. On the Home Page, it will show as an <strong>Upcoming Challenge</strong> with a live countdown timer until launch!
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                          borderRadius: '10px',
                          border: '1.5px solid #6ee7b7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#059669',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            🔥
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#047857' }}>
                              Home Page Display: LIVE ARENA NOW
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#065f46', marginTop: '2px', lineHeight: 1.4 }}>
                              This challenge will be <strong>LIVE immediately</strong> on the Home Page. Players can register and compete right away!
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PRIZE IMAGE (UPLOAD FROM DEVICE OR PASTE URL) */}
                    <div style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <ImageIcon size={16} color="#0284c7" />
                            <span>Challenge Prize Image</span>
                          </label>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Upload directly from your device or paste an image URL
                          </span>
                        </div>

                        {/* Mode Switcher Tabs */}
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => setImageInputMode('upload')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              border: 'none',
                              background: imageInputMode === 'upload' ? '#ffffff' : 'transparent',
                              color: imageInputMode === 'upload' ? '#0284c7' : '#64748b',
                              boxShadow: imageInputMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <UploadCloud size={13} />
                            <span>Upload File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode('url')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              border: 'none',
                              background: imageInputMode === 'url' ? '#ffffff' : 'transparent',
                              color: imageInputMode === 'url' ? '#0284c7' : '#64748b',
                              boxShadow: imageInputMode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <LinkIcon size={13} />
                            <span>Image URL</span>
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: FILE UPLOAD (DRAG & DROP / BROWSE) */}
                      {imageInputMode === 'upload' ? (
                        <div>
                          <div
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleImageUploadFile(e.dataTransfer.files[0]);
                              }
                            }}
                            style={{
                              border: isDragging ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                              borderRadius: '12px',
                              padding: '24px 16px',
                              textAlign: 'center',
                              background: isDragging ? '#f0f9ff' : '#f8fafc',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageUploadFile(e.target.files[0]);
                                }
                              }}
                            />
                            {isUploadingImage ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw size={24} className="spin text-sky-600" />
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>
                                  Uploading prize image...
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '50%',
                                  background: '#e0f2fe',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#0284c7',
                                  marginBottom: '2px'
                                }}>
                                  <UploadCloud size={24} />
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                                  Click to browse or drag & drop prize image here
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Supports PNG, JPG, JPEG, WebP, SVG from your device (Max 10MB)
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* MODE 2: WEB URL INPUT */
                        <div>
                          <input
                            type="url"
                            placeholder="https://example.com/images/prize.jpg"
                            value={editingTournament.image_url || ''}
                            onChange={(e) => setEditingTournament({ ...editingTournament, image_url: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Paste direct Unsplash or web CDN image URL
                          </span>
                        </div>
                      )}

                      {/* LIVE IMAGE PREVIEW CARD */}
                      {editingTournament.image_url && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={editingTournament.image_url}
                              alt="Prize Preview"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80';
                              }}
                              style={{
                                width: '58px',
                                height: '58px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#fff'
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <CheckCircle2 size={13} color="#10b981" />
                                <span>Prize Image Attached</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {editingTournament.image_url.startsWith('data:') ? 'Local Image File (Data URL)' : editingTournament.image_url}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setImageInputMode('upload');
                                if (fileInputRef.current) fileInputRef.current.click();
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#0284c7',
                                cursor: 'pointer'
                              }}
                            >
                              Replace Image
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTournament({ ...editingTournament, image_url: '' })}
                              style={{
                                background: '#fff1f2',
                                border: '1px solid #fecdd3',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#e11d48',
                                cursor: 'pointer'
                              }}
                              title="Clear image"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" style={{ background: '#0284c7', color: '#fff', padding: '9px 20px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                        Save Challenge to Database
                      </button>
                      <button type="button" onClick={() => setEditingTournament(null)} style={{ background: '#e2e8f0', color: '#334155', padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* CHALLENGES LIST CARDS */}
                {filteredTournaments.length === 0 ? (
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '48px 24px',
                    textAlign: 'center'
                  }}>
                    <Filter size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      No Challenges Match Your Filters
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      Try adjusting your name search, timeline filter, or status filter.
                    </div>
                    {isChallengeFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetChallengeFilters}
                        style={{
                          marginTop: '14px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredTournaments.map((t) => {
                      const isActive = t.status === 'ACTIVE';
                      const isInactive = t.status === 'INACTIVE';
                      const isConcluded = t.status === 'CONCLUDED';
                      const createdFormatted = t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                      return (
                        <div key={t.id} style={{
                          border: t.is_featured 
                            ? '2px solid #0284c7' 
                            : isInactive 
                            ? '1.5px solid #fecaca' 
                            : '1px solid #e2e8f0',
                          background: t.is_featured 
                            ? '#f0f9ff' 
                            : isInactive 
                            ? '#fffaf0' 
                            : '#ffffff',
                          borderRadius: '14px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                          boxShadow: t.is_featured ? '0 4px 12px rgba(2, 132, 199, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                          opacity: isInactive ? 0.92 : 1
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <img
                              src={t.image_url}
                              alt=""
                              style={{ 
                                width: '58px', 
                                height: '58px', 
                                borderRadius: '10px', 
                                objectFit: 'cover',
                                filter: isInactive ? 'grayscale(35%)' : 'none'
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a' }}>{t.title}</span>
                                
                                {t.is_featured && (
                                  <span style={{
                                    background: '#fef3c7',
                                    border: '1px solid #fcd34d',
                                    color: '#92400e',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                    <span>Hero Featured</span>
                                  </span>
                                )}

                                {/* Status Pill Badge */}
                                {isActive && (
                                  t.start_time && new Date(t.start_time).getTime() > Date.now() ? (
                                    <span style={{
                                      background: '#f5f3ff',
                                      border: '1.5px solid #c4b5fd',
                                      color: '#6d28d9',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
                                      ⏳ UPCOMING (Starts {new Date(t.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                                    </span>
                                  ) : (
                                    <span style={{
                                      background: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      color: '#047857',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                      🟢 LIVE NOW
                                    </span>
                                  )
                                )}
                                {isInactive && (
                                  <span style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#b91c1c',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                    INACTIVE (DEACTIVATED)
                                  </span>
                                )}
                                {isConcluded && (
                                  <span style={{
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    color: '#475569',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    👑 CONCLUDED
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                Fee: ₹{Number(t.entry_fee).toLocaleString('en-IN')} &bull; Slots: {t.slots_filled} / {t.total_slots} &bull; Category: <span style={{ color: '#0369a1', fontWeight: '600' }}>{t.category}</span>
                                {t.start_time && (
                                  <span style={{ marginLeft: '8px', color: (t.start_time && new Date(t.start_time).getTime() > Date.now()) ? '#7c3aed' : '#059669', fontWeight: '700' }}>
                                    &bull; 🚀 Starts: {new Date(t.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {t.end_time && (
                                  <span style={{ marginLeft: '8px', color: '#0284c7', fontWeight: '700' }}>
                                    &bull; ⏳ Ends: {new Date(t.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {createdFormatted && (
                                  <span style={{ marginLeft: '8px', color: '#94a3b8' }}>
                                    &bull; Added: {createdFormatted}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* VIEW JOINED PARTICIPANTS BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCompForParticipants(t.id);
                                setActiveTab('participants');
                              }}
                              title="View all users who joined this competition"
                              style={{
                                background: '#eff6ff',
                                border: '1.5px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}
                            >
                              <Users size={13} strokeWidth={2.5} />
                              <span>Joined Users ({t.slots_filled || 0})</span>
                            </button>

                            {/* ACTIVE / DEACTIVATE ACTION BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleToggleTournamentStatus(t)}
                              title={isActive ? 'Click to Deactivate challenge' : 'Click to Activate challenge'}
                              style={{
                                background: isActive ? '#fff1f2' : '#ecfdf5',
                                border: `1.5px solid ${isActive ? '#f43f5e' : '#10b981'}`,
                                color: isActive ? '#e11d48' : '#047857',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}
                            >
                              <Power size={13} strokeWidth={2.5} />
                              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            {/* Set as Homepage Hero Button */}
                            {t.is_featured ? (
                              <span style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Star size={13} fill="#0284c7" color="#0284c7" />
                                <span>Active on Home</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetFeatured(t.id)}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #0284c7',
                                  color: '#0284c7',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <Star size={13} />
                                <span>Show on Home</span>
                              </button>
                            )}

                            {isActive && (
                              <button
                                onClick={() => handleDeclareWinner(t.id)}
                                style={{
                                  background: '#fef3c7',
                                  border: '1px solid #fcd34d',
                                  color: '#92400e',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Award size={14} />
                                <span>Step 7: Declare Winner</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                let days = 5;
                                const startTime = t.start_time || new Date().toISOString();
                                if (t.end_time) {
                                  const diffMs = new Date(t.end_time).getTime() - new Date(startTime).getTime();
                                  const calculated = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                                  if (calculated > 0) days = calculated;
                                }
                                setEditingTournament({
                                  ...t,
                                  duration_days: t.duration_days || days,
                                  start_time: startTime,
                                  end_time: t.end_time || new Date(new Date(startTime).getTime() + days * 24 * 60 * 60 * 1000).toISOString()
                                });
                              }}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#334155',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2.5: COMPETITION PARTICIPANTS (JOINED CONTESTANTS) */}
          {activeTab === 'participants' && (
            <CompetitionParticipantsView
              selectedTournamentId={selectedCompForParticipants}
              onSelectTournamentId={(id) => setSelectedCompForParticipants(id)}
              notify={notify}
            />
          )}

          {/* TAB 3: GUARANTEED GIFTS & AVAILABLE OPTIONS CONTROLLER */}
          {activeTab === 'gifts' && (() => {
            // Extract unique categories for filter dropdown
            const categories = Array.from(new Set(gifts.map((g) => g.category).filter(Boolean)));

            // Compute filtered and sorted gifts
            const filteredGifts = gifts.filter((g) => {
              // 1. Search by name, category, tagline, description
              if (giftSearch.trim()) {
                const q = giftSearch.toLowerCase().trim();
                const matchName = (g.name || '').toLowerCase().includes(q);
                const matchCat = (g.category || '').toLowerCase().includes(q);
                const matchTag = (g.tagline || '').toLowerCase().includes(q);
                const matchDesc = (g.description || '').toLowerCase().includes(q);
                if (!matchName && !matchCat && !matchTag && !matchDesc) return false;
              }

              // 2. Status filter
              if (giftStatusFilter !== 'ALL') {
                const isActive = g.is_active !== false;
                if (giftStatusFilter === 'ACTIVE' && !isActive) return false;
                if (giftStatusFilter === 'INACTIVE' && isActive) return false;
              }

              // 3. Category filter
              if (giftCategoryFilter !== 'ALL') {
                if ((g.category || '').toLowerCase() !== giftCategoryFilter.toLowerCase()) return false;
              }

              // 4. Date / Month / Week Timeline filter
              if (giftTimeFilter !== 'ALL') {
                const itemTime = new Date(g.created_at || Date.now()).getTime();
                const now = Date.now();

                if (giftTimeFilter === 'WEEK') {
                  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
                  if (itemTime < oneWeekAgo) return false;
                } else if (giftTimeFilter === 'MONTH') {
                  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
                  if (itemTime < oneMonthAgo) return false;
                } else if (giftTimeFilter === 'CUSTOM') {
                  if (giftStartDate) {
                    const start = new Date(giftStartDate).getTime();
                    if (itemTime < start) return false;
                  }
                  if (giftEndDate) {
                    const end = new Date(giftEndDate).getTime() + 24 * 60 * 60 * 1000 - 1;
                    if (itemTime > end) return false;
                  }
                }
              }

              return true;
            }).sort((a, b) => {
              if (giftSortBy === 'NEWEST') {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
              } else if (giftSortBy === 'OLDEST') {
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
              } else if (giftSortBy === 'NAME_ASC') {
                return (a.name || '').localeCompare(b.name || '');
              } else if (giftSortBy === 'PRICE_DESC') {
                return (parseFloat(b.market_value) || 0) - (parseFloat(a.market_value) || 0);
              }
              return 0;
            });

            const activeGiftsCount = gifts.filter((g) => g.is_active !== false).length;
            const inactiveGiftsCount = gifts.filter((g) => g.is_active === false).length;

            const isGiftFilterActive =
              giftSearch !== '' ||
              giftStatusFilter !== 'ALL' ||
              giftCategoryFilter !== 'ALL' ||
              giftTimeFilter !== 'ALL' ||
              giftStartDate !== '' ||
              giftEndDate !== '' ||
              giftSortBy !== 'DEFAULT';

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                      Guaranteed Physical Apparel Rewards & Options Controller
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Activate, deactivate, filter, and configure products, retail values, sizes, and color shades.
                    </p>
                  </div>

                  <button
                    onClick={startAddGift}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Plus size={16} />
                    <span>Add Guaranteed Gift</span>
                  </button>
                </div>

                {/* FILTER & SEARCH TOOLBAR (Name, Category, Status, Date / Week / Month, Sort) */}
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  {/* Row 1: Search by Name/Tagline, Category Selector, and Status Filter Pills */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    {/* Name Wise Search Input */}
                    <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
                      <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search gift by name, category, fabric..."
                        value={giftSearch}
                        onChange={(e) => setGiftSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 34px 9px 36px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#0f172a',
                          outline: 'none',
                          background: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                      {giftSearch && (
                        <button
                          type="button"
                          onClick={() => setGiftSearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Category:</span>
                      <select
                        value={giftCategoryFilter}
                        onChange={(e) => setGiftCategoryFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#0f172a',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Categories</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>Status:</span>
                      {[
                        { id: 'ALL', label: `All (${gifts.length})` },
                        { id: 'ACTIVE', label: `Active (${activeGiftsCount})`, color: '#10b981' },
                        { id: 'INACTIVE', label: `Inactive (${inactiveGiftsCount})`, color: '#ef4444' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setGiftStatusFilter(st.id)}
                          style={{
                            background: giftStatusFilter === st.id ? '#0284c7' : '#f1f5f9',
                            color: giftStatusFilter === st.id ? '#ffffff' : '#334155',
                            border: giftStatusFilter === st.id ? '1px solid #0284c7' : '1px solid transparent',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {st.color && (
                            <span style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: giftStatusFilter === st.id ? '#ffffff' : st.color
                            }} />
                          )}
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Date / Month / Week Filter & Sort & Reset */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {/* Timeline filter: Date, Week, Month */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={15} color="#0284c7" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Timeline:</span>
                        <select
                          value={giftTimeFilter}
                          onChange={(e) => setGiftTimeFilter(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="ALL">All Time</option>
                          <option value="WEEK">📅 This Week (Last 7 Days)</option>
                          <option value="MONTH">🗓️ This Month (Last 30 Days)</option>
                          <option value="CUSTOM">🎯 Custom Date Range</option>
                        </select>
                      </div>

                      {/* Custom Date Pickers */}
                      {giftTimeFilter === 'CUSTOM' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="date"
                            value={giftStartDate}
                            onChange={(e) => setGiftStartDate(e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '12px',
                              color: '#0f172a',
                              background: '#fff'
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
                          <input
                            type="date"
                            value={giftEndDate}
                            onChange={(e) => setGiftEndDate(e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '12px',
                              color: '#0f172a',
                              background: '#fff'
                            }}
                          />
                        </div>
                      )}

                      {/* Sort Order */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Sort:</span>
                        <select
                          value={giftSortBy}
                          onChange={(e) => setGiftSortBy(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="DEFAULT">Default Order</option>
                          <option value="NEWEST">Newest Added First</option>
                          <option value="OLDEST">Oldest First</option>
                          <option value="NAME_ASC">Name (A–Z)</option>
                          <option value="PRICE_DESC">MRP (High to Low)</option>
                        </select>
                      </div>
                    </div>

                    {/* Result Count & Reset Filters Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Showing <strong>{filteredGifts.length}</strong> of {gifts.length} Gifts
                      </span>
                      {isGiftFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetGiftFilters}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {editingGift ? (
                  <form onSubmit={handleSaveGift} style={{ background: '#f8fafc', padding: '24px', borderRadius: '18px', border: '1px solid #cbd5e1', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                        {editingGift.id ? `Edit Guaranteed Gift: ${editingGift.name}` : 'Create New Guaranteed Apparel Reward'}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
                        Database Level Configuration
                      </span>
                    </div>

                    {/* Row 1: Name & Category */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={editingGift.name}
                          onChange={(e) => setEditingGift({ ...editingGift, name: e.target.value })}
                          placeholder="e.g. Urban Heavyweight Streetwear Graphic T-Shirt"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Category (T-Shirt, Saree, Kurti, etc.)
                        </label>
                        <input
                          type="text"
                          value={editingGift.category}
                          onChange={(e) => setEditingGift({ ...editingGift, category: e.target.value })}
                          placeholder="e.g. T-Shirt"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          required
                        />
                      </div>
                    </div>

                    {/* Row 2: MRP, Stock, Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          MRP / Market Value (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingGift.market_value}
                          onChange={(e) => setEditingGift({ ...editingGift, market_value: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Stock / Available Inventory
                        </label>
                        <input
                          type="number"
                          value={editingGift.stock !== undefined ? editingGift.stock : 500}
                          onChange={(e) => setEditingGift({ ...editingGift, stock: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Visibility Status
                        </label>
                        <select
                          value={editingGift.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                          onChange={(e) => setEditingGift({ ...editingGift, is_active: e.target.value === 'ACTIVE' })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: '#ffffff',
                            color: editingGift.is_active !== false ? '#059669' : '#dc2626'
                          }}
                        >
                          <option value="ACTIVE">🟢 Active (Visible to Players)</option>
                          <option value="INACTIVE">⏸️ Inactive (Hidden from Players)</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Product Image Upload / URL Selector */}
                    <div style={{
                      marginBottom: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            <ImageIcon size={16} color="#0284c7" />
                            <span>Product & Apparel Image</span>
                          </label>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            Upload product photo from your device or paste a web image URL
                          </span>
                        </div>

                        {/* Mode Switcher Tabs */}
                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => setGiftImageInputMode('upload')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              border: 'none',
                              background: giftImageInputMode === 'upload' ? '#ffffff' : 'transparent',
                              color: giftImageInputMode === 'upload' ? '#0284c7' : '#64748b',
                              boxShadow: giftImageInputMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <UploadCloud size={13} />
                            <span>Upload File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGiftImageInputMode('url')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              border: 'none',
                              background: giftImageInputMode === 'url' ? '#ffffff' : 'transparent',
                              color: giftImageInputMode === 'url' ? '#0284c7' : '#64748b',
                              boxShadow: giftImageInputMode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <LinkIcon size={13} />
                            <span>Image URL</span>
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: FILE UPLOAD (DRAG & DROP / BROWSE) */}
                      {giftImageInputMode === 'upload' ? (
                        <div>
                          <div
                            onClick={() => giftFileInputRef.current && giftFileInputRef.current.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsGiftDragging(true); }}
                            onDragLeave={() => setIsGiftDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsGiftDragging(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleGiftImageUploadFile(e.dataTransfer.files[0]);
                              }
                            }}
                            style={{
                              border: isGiftDragging ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                              borderRadius: '12px',
                              padding: '22px 16px',
                              textAlign: 'center',
                              background: isGiftDragging ? '#f0f9ff' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              ref={giftFileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleGiftImageUploadFile(e.target.files[0]);
                                }
                              }}
                            />
                            {isUploadingGiftImage ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw size={24} className="spin text-sky-600" />
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>
                                  Uploading apparel product image...
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  background: '#e0f2fe',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#0284c7',
                                  marginBottom: '2px'
                                }}>
                                  <UploadCloud size={22} />
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                                  Click to browse or drag & drop apparel product image here
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Supports PNG, JPG, JPEG, WebP, SVG from your device (Max 10MB)
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* MODE 2: WEB URL INPUT */
                        <div>
                          <input
                            type="url"
                            placeholder="https://example.com/images/tshirt.jpg"
                            value={editingGift.image_url || ''}
                            onChange={(e) => setEditingGift({ ...editingGift, image_url: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
                          />
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Paste direct Unsplash or web CDN image URL
                          </span>
                        </div>
                      )}

                      {/* LIVE IMAGE PREVIEW CARD */}
                      {editingGift.image_url && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          background: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={editingGift.image_url}
                              alt="Product Preview"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
                              }}
                              style={{
                                width: '56px',
                                height: '56px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc'
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <CheckCircle2 size={13} color="#10b981" />
                                <span>Product Image Attached</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {editingGift.image_url.startsWith('data:') ? 'Local Image File (Data URL)' : editingGift.image_url}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setGiftImageInputMode('upload');
                                if (giftFileInputRef.current) giftFileInputRef.current.click();
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#0284c7',
                                cursor: 'pointer'
                              }}
                            >
                              Replace Image
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingGift({ ...editingGift, image_url: '' })}
                              style={{
                                background: '#fff1f2',
                                border: '1px solid #fecdd3',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#e11d48',
                                cursor: 'pointer'
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Row 3: Fabric & Design Tagline */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Fabric & Design Description Tagline
                    </label>
                    <input
                      type="text"
                      value={editingGift.tagline}
                      onChange={(e) => setEditingGift({ ...editingGift, tagline: e.target.value })}
                      placeholder="e.g. 100% 240 GSM Combed Cotton, drop shoulder relaxed fit..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  {/* SPECIAL SECTION: AVAILABLE OPTIONS CONTROLLER (SIZES & COLORS) */}
                  <div style={{
                    background: '#ffffff',
                    border: '2px solid #0284c7',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gift size={20} color="#0284c7" />
                        <div>
                          <h5 style={{ fontSize: '14px', fontWeight: '800', color: '#0284c7', margin: 0, textTransform: 'uppercase' }}>
                            Available Options Controller (Sizes & Colors)
                          </h5>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            These options are dynamically rendered to players in Step 3 when joining the challenge.
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', background: '#e0f2fe', padding: '4px 8px', borderRadius: '6px' }}>
                        Live DB Sync
                      </span>
                    </div>

                    {/* 1. AVAILABLE SIZES CONTROLLER */}
                    <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                          1. Configured Sizes ({((editingGift.sizes && editingGift.sizes.length > 0) ? editingGift.sizes : (editingGift.sizesText ? editingGift.sizesText.split(',').map(s => s.trim()).filter(Boolean) : ['Free Size'])).length})
                        </label>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Click &times; to remove or use presets below
                        </span>
                      </div>

                      {/* Active Size Chips with Remove Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', minHeight: '32px', alignItems: 'center' }}>
                        {((editingGift.sizes && editingGift.sizes.length > 0) ? editingGift.sizes : (editingGift.sizesText ? editingGift.sizesText.split(',').map(s => s.trim()).filter(Boolean) : ['Free Size'])).map((sz, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#0284c7',
                              color: '#ffffff',
                              padding: '5px 8px 5px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              lineHeight: 1,
                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
                            }}
                          >
                            <span style={{ lineHeight: 1 }}>{sz}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSize(sz)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.25)',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.45)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              title={`Remove size ${sz}`}
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Custom Size Inline Input */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSize(customSizeInput);
                            }
                          }}
                          placeholder="Type custom size (e.g. S, M, XXL, 38, Free Size)..."
                          style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSize(customSizeInput)}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          + Add Size
                        </button>
                      </div>

                      {/* Quick Presets for Sizes */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Quick Add Presets:</span>
                        {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddSize(preset)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      {/* Comma-separated raw text box */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                          Bulk Edit (Comma-separated text):
                        </label>
                        <input
                          type="text"
                          value={editingGift.sizesText || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = val.split(',').map(s => s.trim()).filter(Boolean);
                            setEditingGift({ ...editingGift, sizesText: val, sizes: parsed });
                          }}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    {/* 2. AVAILABLE COLOR SHADES CONTROLLER */}
                    <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                          2. Configured Color Shades ({((editingGift.colors && editingGift.colors.length > 0) ? editingGift.colors : (editingGift.colorsText ? editingGift.colorsText.split(',').map(c => c.trim()).filter(Boolean) : ['Standard'])).length})
                        </label>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Click &times; to remove or use presets below
                        </span>
                      </div>

                      {/* Active Color Chips with Remove Buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', minHeight: '32px', alignItems: 'center' }}>
                        {((editingGift.colors && editingGift.colors.length > 0) ? editingGift.colors : (editingGift.colorsText ? editingGift.colorsText.split(',').map(c => c.trim()).filter(Boolean) : ['Standard'])).map((col, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              padding: '5px 8px 5px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              lineHeight: 1,
                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.1)'
                            }}
                          >
                            <span style={{ lineHeight: 1 }}>{col}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(col)}
                              style={{
                                background: 'rgba(2, 132, 199, 0.2)',
                                border: 'none',
                                color: '#0369a1',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(2, 132, 199, 0.35)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(2, 132, 199, 0.2)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              title={`Remove color ${col}`}
                            >
                              <X size={10} strokeWidth={3} />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Custom Color Inline Input */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={customColorInput}
                          onChange={(e) => setCustomColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddColor(customColorInput);
                            }
                          }}
                          placeholder="Type custom color name (e.g. Charcoal Black, Crimson Red, Dusty Teal)..."
                          style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddColor(customColorInput)}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          + Add Color
                        </button>
                      </div>

                      {/* Quick Presets for Colors */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Quick Add Presets:</span>
                        {[
                          'Charcoal Black', 'Vintage Off-White', 'Midnight Navy', 
                          'Royal Peacock Blue', 'Crimson Red', 'Emerald Green', 
                          'Royal Wine', 'Rose Gold', 'Dusty Teal', 'Classic Maroon'
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddColor(preset)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      {/* Comma-separated raw text box */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                          Bulk Edit (Comma-separated text):
                        </label>
                        <input
                          type="text"
                          value={editingGift.colorsText || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = val.split(',').map(c => c.trim()).filter(Boolean);
                            setEditingGift({ ...editingGift, colorsText: val, colors: parsed });
                          }}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    {/* 3. LIVE PLAYER CHECKOUT PREVIEW (Step 3 matching Screenshot 2) */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px dashed #0284c7',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                          LIVE PLAYER PREVIEW
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                          How this gift will appear to users in Step 3 when joining a challenge:
                        </span>
                      </div>

                      {/* Preview Size Selector */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                          Select Size for {editingGift.category || 'Apparel'}:
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {((editingGift.sizes && editingGift.sizes.length > 0) ? editingGift.sizes : (editingGift.sizesText ? editingGift.sizesText.split(',').map(s => s.trim()).filter(Boolean) : ['Free Size'])).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setPreviewSelectedSize(sz)}
                              style={{
                                minWidth: '40px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                border: previewSelectedSize === sz ? '2px solid #0284c7' : '1px solid #cbd5e1',
                                background: previewSelectedSize === sz ? '#0284c7' : '#ffffff',
                                color: previewSelectedSize === sz ? '#ffffff' : '#334155',
                                cursor: 'pointer'
                              }}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview Color Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                          Select Color Shade:
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {((editingGift.colors && editingGift.colors.length > 0) ? editingGift.colors : (editingGift.colorsText ? editingGift.colorsText.split(',').map(c => c.trim()).filter(Boolean) : ['Standard'])).map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setPreviewSelectedColor(col)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: previewSelectedColor === col ? '2px solid #0284c7' : '1px solid #cbd5e1',
                                background: previewSelectedColor === col ? '#f0f9ff' : '#ffffff',
                                color: previewSelectedColor === col ? '#0284c7' : '#334155',
                                cursor: 'pointer'
                              }}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#fff',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                        cursor: 'pointer'
                      }}
                    >
                      Save Gift & Options to DB
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGift(null)}
                      style={{
                        background: '#e2e8f0',
                        color: '#334155',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

                {/* Gifts Directory Cards List */}
                {filteredGifts.length === 0 ? (
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '48px 24px',
                    textAlign: 'center'
                  }}>
                    <Filter size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      No Guaranteed Gifts Match Your Filters
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      Try adjusting your search query, status pill, category, or timeline filter.
                    </div>
                    {isGiftFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetGiftFilters}
                        style={{
                          marginTop: '14px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {filteredGifts.map((g) => {
                      let opts = g.options;
                      if (typeof opts === 'string') {
                        try { opts = JSON.parse(opts); } catch (e) { opts = {}; }
                      }
                      const sizes = Array.isArray(opts?.sizes) ? opts.sizes : ['Free Size'];
                      const colors = Array.isArray(opts?.colors) ? opts.colors : ['Standard'];
                      const isActive = g.is_active !== false;
                      const createdFormatted = g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                      return (
                        <div
                          key={g.id}
                          style={{
                            border: isActive ? '1px solid #e2e8f0' : '1.5px solid #fecaca',
                            borderRadius: '16px',
                            padding: '16px',
                            background: isActive ? '#ffffff' : '#fffaf0',
                            boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.03)' : '0 2px 6px rgba(239, 68, 68, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: isActive ? 1 : 0.92,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <img
                              src={g.image_url}
                              alt=""
                              style={{
                                width: '74px',
                                height: '74px',
                                borderRadius: '10px',
                                objectFit: 'cover',
                                flexShrink: 0,
                                filter: isActive ? 'none' : 'grayscale(35%)'
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase' }}>
                                  {g.category}
                                </span>
                                {/* Live Status Badge */}
                                {isActive ? (
                                  <span style={{
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    color: '#047857',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                    ACTIVE
                                  </span>
                                ) : (
                                  <span style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#b91c1c',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                    INACTIVE (DEACTIVATED)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>
                                {g.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                                  MRP: ₹{Number(g.market_value).toLocaleString('en-IN')}
                                </span>
                                {createdFormatted && (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    &bull; Added: {createdFormatted}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Display Configured Available Options */}
                          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '12px', fontSize: '11px' }}>
                            <div style={{ marginBottom: '6px' }}>
                              <strong style={{ color: '#334155' }}>Configured Sizes ({sizes.length}):</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                {sizes.map((s, i) => (
                                  <span key={i} style={{ background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <strong style={{ color: '#334155' }}>Configured Colors ({colors.length}):</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                {colors.map((c, i) => (
                                  <span key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Card Actions Footer: Activate / Deactivate Toggle and Edit Button */}
                          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleGiftStatus(g)}
                              title={isActive ? 'Click to Deactivate gift (hide from users)' : 'Click to Activate gift (show to users)'}
                              style={{
                                background: isActive ? '#fff1f2' : '#ecfdf5',
                                border: `1.5px solid ${isActive ? '#f43f5e' : '#10b981'}`,
                                color: isActive ? '#e11d48' : '#047857',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Power size={13} strokeWidth={2.5} />
                              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            <button
                              onClick={() => startEditGift(g)}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit size={13} />
                              <span>Edit Gift & Options</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: ORDERS & LOGISTICS (STEP 6 COURIER DISPATCHES) */}
          {activeTab === 'orders' && (() => {
            // Distinct challenges for the challenge dropdown filter
            const availableChallenges = (() => {
              const map = new Map();
              tournaments.forEach(t => {
                map.set(String(t.id), { id: t.id, title: t.title });
              });
              orders.forEach(o => {
                if (o.tournament_id && !map.has(String(o.tournament_id))) {
                  map.set(String(o.tournament_id), { id: o.tournament_id, title: o.tournament_title || `Challenge #${o.tournament_id}` });
                }
              });
              return Array.from(map.values());
            })();

            // Filtered orders list based on status, challenge, and search query
            const filteredOrders = orders.filter((o) => {
              // 1. Status Filter
              if (orderStatusFilter !== 'ALL') {
                if (o.fulfillment_status !== orderStatusFilter) return false;
              }

              // 2. Challenge Filter
              if (orderChallengeFilter !== 'ALL') {
                if (String(o.tournament_id) !== String(orderChallengeFilter)) return false;
              }

              // 3. Search query
              if (orderSearch.trim()) {
                const q = orderSearch.toLowerCase();
                const matchOrder = o.order_number?.toLowerCase().includes(q);
                const matchCust = o.shipping_name?.toLowerCase().includes(q);
                const matchPhone = o.shipping_phone?.toLowerCase().includes(q);
                const matchCity = o.shipping_city?.toLowerCase().includes(q);
                const matchPincode = o.shipping_pincode?.toLowerCase().includes(q);
                const matchGift = o.gift_name?.toLowerCase().includes(q);
                const matchCourier = o.courier_partner?.toLowerCase().includes(q);
                const matchTracking = o.tracking_number?.toLowerCase().includes(q);
                const matchTitle = o.tournament_title?.toLowerCase().includes(q);
                if (!matchOrder && !matchCust && !matchPhone && !matchCity && !matchPincode && !matchGift && !matchCourier && !matchTracking && !matchTitle) {
                  return false;
                }
              }

              return true;
            });

            const orderStats = {
              total: orders.length,
              orderPlaced: orders.filter(o => o.fulfillment_status === 'ORDER_PLACED').length,
              dispatched: orders.filter(o => o.fulfillment_status === 'DISPATCHED').length,
              outForDelivery: orders.filter(o => o.fulfillment_status === 'OUT_FOR_DELIVERY').length,
              delivered: orders.filter(o => o.fulfillment_status === 'DELIVERED').length
            };

            const COURIER_PARTNERS = [
              'BlueDart Express',
              'Delhivery Logistics',
              'DTDC Express',
              'Shadowfax',
              'India Post Speed Post',
              'Ekart Logistics'
            ];

            return (
              <div>
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={20} color="#0284c7" />
                      <span>Logistics & Courier Dispatches Management</span>
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      Manage courier dispatches, update AWB tracking, and filter apparel orders by status and challenge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadData}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    <span>Refresh Orders</span>
                  </button>
                </div>

                {/* 1. Summary Stat Counter Cards (Clickable) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                  {/* All Orders Card */}
                  <div
                    onClick={() => setOrderStatusFilter('ALL')}
                    style={{
                      background: orderStatusFilter === 'ALL' ? '#f0f9ff' : '#ffffff',
                      border: orderStatusFilter === 'ALL' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: orderStatusFilter === 'ALL' ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>All Orders</span>
                      <Package size={16} color="#64748b" />
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>{orderStats.total}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Total guaranteed gift entries</div>
                  </div>

                  {/* Order Placed (Pending Courier) Card */}
                  <div
                    onClick={() => setOrderStatusFilter('ORDER_PLACED')}
                    style={{
                      background: orderStatusFilter === 'ORDER_PLACED' ? '#fffbeb' : '#ffffff',
                      border: orderStatusFilter === 'ORDER_PLACED' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: orderStatusFilter === 'ORDER_PLACED' ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>⏳ Order Placed</span>
                      <Clock size={16} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#b45309' }}>{orderStats.orderPlaced}</div>
                    <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>Awaiting courier dispatch</div>
                  </div>

                  {/* Couriered / Dispatched Card */}
                  <div
                    onClick={() => setOrderStatusFilter('DISPATCHED')}
                    style={{
                      background: orderStatusFilter === 'DISPATCHED' ? '#f0f9ff' : '#ffffff',
                      border: orderStatusFilter === 'DISPATCHED' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: orderStatusFilter === 'DISPATCHED' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase' }}>🚚 Courier Done</span>
                      <Truck size={16} color="#0284c7" />
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7' }}>{orderStats.dispatched}</div>
                    <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>Dispatched & In Transit</div>
                  </div>

                  {/* Delivered Card */}
                  <div
                    onClick={() => setOrderStatusFilter('DELIVERED')}
                    style={{
                      background: orderStatusFilter === 'DELIVERED' ? '#f0fdf4' : '#ffffff',
                      border: orderStatusFilter === 'DELIVERED' ? '2px solid #10b981' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: orderStatusFilter === 'DELIVERED' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>✅ Delivered</span>
                      <CheckCircle2 size={16} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669' }}>{orderStats.delivered}</div>
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Successfully received</div>
                  </div>
                </div>

                {/* 2. Filters & Search Toolbar (Challenge + Status + Search) */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {/* Search Input */}
                    <div style={{ flex: '1 1 260px', position: 'relative' }}>
                      <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by Order #, Customer, Phone, City, Tracking, Gift..."
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          background: '#f8fafc'
                        }}
                      />
                      {orderSearch && (
                        <button
                          type="button"
                          onClick={() => setOrderSearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Challenge Base Filter Dropdown (User requested: Filter la challenge base panni venum) */}
                    <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={orderChallengeFilter}
                          onChange={(e) => setOrderChallengeFilter(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px 9px 34px',
                            borderRadius: '8px',
                            border: orderChallengeFilter !== 'ALL' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: orderChallengeFilter !== 'ALL' ? '#f0f9ff' : '#ffffff',
                            color: orderChallengeFilter !== 'ALL' ? '#0284c7' : '#1e293b',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="ALL">🏆 All Challenges & Tournaments ({availableChallenges.length})</option>
                          {availableChallenges.map((ch) => {
                            const countInChallenge = orders.filter(o => String(o.tournament_id) === String(ch.id)).length;
                            return (
                              <option key={ch.id} value={ch.id}>
                                🏆 {ch.title} ({countInChallenge} orders)
                              </option>
                            );
                          })}
                        </select>
                        <Trophy size={15} color={orderChallengeFilter !== 'ALL' ? '#0284c7' : '#64748b'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    {/* Reset Filters button */}
                    {(orderStatusFilter !== 'ALL' || orderChallengeFilter !== 'ALL' || orderSearch) && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderStatusFilter('ALL');
                          setOrderChallengeFilter('ALL');
                          setOrderSearch('');
                        }}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>

                  {/* Status Filter Pills (User requested: Order placed and couries done ana items parka) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>
                      Status Filter:
                    </span>
                    {[
                      { id: 'ALL', label: 'All Orders', count: orderStats.total, color: '#0284c7', bg: '#e0f2fe' },
                      { id: 'ORDER_PLACED', label: '⏳ Order Placed', count: orderStats.orderPlaced, color: '#b45309', bg: '#fef3c7' },
                      { id: 'DISPATCHED', label: '🚚 Courier Done', count: orderStats.dispatched, color: '#0369a1', bg: '#e0f2fe' },
                      { id: 'OUT_FOR_DELIVERY', label: '🛵 Out for Delivery', count: orderStats.outForDelivery, color: '#7e22ce', bg: '#f3e8ff' },
                      { id: 'DELIVERED', label: '✅ Delivered', count: orderStats.delivered, color: '#047857', bg: '#d1fae5' }
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setOrderStatusFilter(pill.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: orderStatusFilter === pill.id ? `2px solid ${pill.color}` : '1px solid #cbd5e1',
                          background: orderStatusFilter === pill.id ? pill.bg : '#ffffff',
                          color: orderStatusFilter === pill.id ? pill.color : '#64748b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{pill.label}</span>
                        <span style={{
                          background: orderStatusFilter === pill.id ? pill.color : '#e2e8f0',
                          color: orderStatusFilter === pill.id ? '#ffffff' : '#475569',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: '800'
                        }}>
                          {pill.count}
                        </span>
                      </button>
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                  </div>
                </div>

                {/* 3. Full Order Update Form (if editingOrder is open) */}
                {editingOrder ? (
                  <form onSubmit={handleUpdateOrderStatus} style={{
                    background: '#f0f9ff',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '2px solid #0284c7',
                    marginBottom: '20px',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #bae6fd', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck size={20} color="#0284c7" />
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0369a1', margin: 0 }}>
                            Update Courier Fulfillment & Dispatch
                          </h4>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Order No: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{editingOrder.order_number}</strong> | Customer: <strong>{editingOrder.shipping_name}</strong> ({editingOrder.shipping_phone})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingOrder(null)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      {/* Status Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          Courier Fulfillment Status
                        </label>
                        <select
                          value={editingOrder.fulfillment_status}
                          onChange={(e) => setEditingOrder({ ...editingOrder, fulfillment_status: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #0284c7',
                            fontSize: '13px',
                            fontWeight: '700',
                            background: '#ffffff',
                            color: '#0284c7'
                          }}
                        >
                          <option value="ORDER_PLACED">⏳ ORDER_PLACED (Order Placed / Packaging)</option>
                          <option value="PACKED">📦 PACKED (Packed & Quality Passed)</option>
                          <option value="DISPATCHED">🚚 DISPATCHED (Couriered / In Transit)</option>
                          <option value="OUT_FOR_DELIVERY">🛵 OUT_FOR_DELIVERY (Out for Delivery)</option>
                          <option value="DELIVERED">✅ DELIVERED (Delivered to Customer)</option>
                        </select>
                      </div>

                      {/* Courier Partner with Preset Buttons */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          Courier Partner
                        </label>
                        <input
                          type="text"
                          value={editingOrder.courier_partner || ''}
                          onChange={(e) => setEditingOrder({ ...editingOrder, courier_partner: e.target.value })}
                          placeholder="e.g. BlueDart Express"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                        />
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {COURIER_PARTNERS.slice(0, 4).map((cp) => (
                            <button
                              key={cp}
                              type="button"
                              onClick={() => setEditingOrder({ ...editingOrder, courier_partner: cp })}
                              style={{
                                background: editingOrder.courier_partner === cp ? '#0284c7' : '#ffffff',
                                color: editingOrder.courier_partner === cp ? '#ffffff' : '#475569',
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

                      {/* AWB Tracking Number with Generate Button */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                            AWB Tracking Number
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const partner = (editingOrder.courier_partner || 'BLUEDART').split(' ')[0].toUpperCase();
                              const rand = Math.floor(1000000 + Math.random() * 9000000);
                              setEditingOrder({ ...editingOrder, tracking_number: `${partner}-IND-${rand}` });
                            }}
                            style={{
                              border: 'none',
                              background: '#e0f2fe',
                              color: '#0284c7',
                              padding: '2px 6px',
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
                          value={editingOrder.tracking_number || ''}
                          onChange={(e) => setEditingOrder({ ...editingOrder, tracking_number: e.target.value })}
                          placeholder="e.g. BLUEDART-IND-1234567"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    {/* Delivery Destination Address Info Card */}
                    <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#475569' }}>
                      <strong style={{ color: '#0f172a' }}>Delivery Address:</strong> {editingOrder.shipping_address}, {editingOrder.shipping_city}, {editingOrder.shipping_state} - {editingOrder.shipping_pincode} | <strong style={{ color: '#0f172a' }}>Gift:</strong> {editingOrder.gift_name} (Size: {editingOrder.selected_size}, Color: {editingOrder.selected_color || 'Standard'})
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="submit"
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#fff',
                          padding: '9px 20px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '13px',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={15} />
                        <span>Save Logistics Update</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOrder(null)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#475569',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {/* 4. Quick Courier Dispatch Modal (When clicking "Mark as Couriered") */}
                {quickDispatchOrder ? (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '16px'
                  }}>
                    <form
                      onSubmit={handleQuickDispatchSubmit}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '24px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                        border: '2px solid #0284c7'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Truck size={20} color="#0284c7" />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                              Mark Order as Couriered & Dispatched
                            </h4>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Update status to DISPATCHED and assign AWB tracking
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuickDispatchOrder(null)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Order info banner */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'monospace', color: '#0284c7' }}>
                            {quickDispatchOrder.order_number}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>
                            {quickDispatchOrder.tournament_title || 'Arcade Challenge'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                          {quickDispatchOrder.shipping_name} ({quickDispatchOrder.shipping_phone})
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          📍 {quickDispatchOrder.shipping_address}, {quickDispatchOrder.shipping_city} ({quickDispatchOrder.shipping_pincode})
                        </div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', marginTop: '6px' }}>
                          🎁 Reward: {quickDispatchOrder.gift_name} (Size: {quickDispatchOrder.selected_size}, Color: {quickDispatchOrder.selected_color || 'Standard'})
                        </div>
                      </div>

                      {/* Courier Partner Selection */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                          Select Courier Partner:
                        </label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {COURIER_PARTNERS.map((cp) => (
                            <button
                              key={cp}
                              type="button"
                              onClick={() => {
                                const partnerUpper = cp.split(' ')[0].toUpperCase();
                                const rand = Math.floor(1000000 + Math.random() * 9000000);
                                setQuickDispatchOrder({
                                  ...quickDispatchOrder,
                                  courier_partner: cp,
                                  tracking_number: `${partnerUpper}-IND-${rand}`
                                });
                              }}
                              style={{
                                background: quickDispatchOrder.courier_partner === cp ? '#0284c7' : '#ffffff',
                                color: quickDispatchOrder.courier_partner === cp ? '#ffffff' : '#334155',
                                border: quickDispatchOrder.courier_partner === cp ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {cp}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AWB Tracking Number Input */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                            AWB Tracking Number:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const partner = (quickDispatchOrder.courier_partner || 'BLUEDART').split(' ')[0].toUpperCase();
                              const rand = Math.floor(1000000 + Math.random() * 9000000);
                              setQuickDispatchOrder({ ...quickDispatchOrder, tracking_number: `${partner}-IND-${rand}` });
                            }}
                            style={{
                              border: 'none',
                              background: '#e0f2fe',
                              color: '#0284c7',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            ⚡ Auto-Generate AWB
                          </button>
                        </div>
                        <input
                          type="text"
                          value={quickDispatchOrder.tracking_number || ''}
                          onChange={(e) => setQuickDispatchOrder({ ...quickDispatchOrder, tracking_number: e.target.value })}
                          placeholder="e.g. BLUEDART-IND-7782918"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            fontWeight: '700'
                          }}
                          required
                        />
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="submit"
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            padding: '11px 18px',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                          }}
                        >
                          <Truck size={16} />
                          <span>Confirm & Mark as Couriered</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickDispatchOrder(null)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#475569',
                            padding: '11px 18px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {/* 5. Orders Table */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Order No & Date</th>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Challenge / Tournament</th>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Customer & Destination</th>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Guaranteed Gift</th>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Courier & Tracking</th>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Courier Status</th>
                          <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <Truck size={36} color="#cbd5e1" />
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                                  No orders match your selected filters
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  Try clearing the status or challenge filters above to view all logistics records.
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderStatusFilter('ALL');
                                    setOrderChallengeFilter('ALL');
                                    setOrderSearch('');
                                  }}
                                  style={{
                                    marginTop: '6px',
                                    background: '#0284c7',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  View All Orders
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o) => {
                            const isOrderPlaced = o.fulfillment_status === 'ORDER_PLACED';
                            const isDispatched = o.fulfillment_status === 'DISPATCHED';
                            const isDelivered = o.fulfillment_status === 'DELIVERED';

                            return (
                              <tr
                                key={o.id}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  background: isOrderPlaced ? '#ffffff' : (isDispatched ? '#f8fafc' : '#ffffff'),
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                {/* Order No & Date */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0284c7', fontSize: '13px' }}>
                                    {o.order_number}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                    {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                                  </div>
                                </td>

                                {/* Challenge / Tournament */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>
                                    <Trophy size={12} color="#0284c7" />
                                    <span>{o.tournament_title || `Challenge #${o.tournament_id}`}</span>
                                  </div>
                                </td>

                                {/* Customer & Destination */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{o.shipping_name}</div>
                                  <div style={{ color: '#64748b', fontSize: '11px' }}>{o.shipping_phone}</div>
                                  <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
                                    📍 {o.shipping_city} ({o.shipping_pincode})
                                  </div>
                                </td>

                                {/* Guaranteed Gift */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b', maxWidth: '200px' }}>
                                    {o.gift_name}
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {o.selected_size && (
                                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                        Size: {o.selected_size}
                                      </span>
                                    )}
                                    {o.selected_color && (
                                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                        Color: {o.selected_color}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Courier & Tracking AWB */}
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '700', color: '#334155' }}>
                                    {o.courier_partner || 'BlueDart Express'}
                                  </div>
                                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                                    {o.tracking_number || 'AWB-PENDING'}
                                  </div>
                                </td>

                                {/* Courier Status (Interactive Badge / Selector) */}
                                <td style={{ padding: '12px 14px' }}>
                                  <select
                                    value={o.fulfillment_status}
                                    onChange={(e) => handleDirectOrderStatusChange(o.id, e.target.value)}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '800',
                                      border: isOrderPlaced
                                        ? '1.5px solid #f59e0b'
                                        : (isDispatched ? '1.5px solid #0284c7' : (isDelivered ? '1.5px solid #10b981' : '1px solid #cbd5e1')),
                                      background: isOrderPlaced
                                        ? '#fef3c7'
                                        : (isDispatched ? '#e0f2fe' : (isDelivered ? '#d1fae5' : '#f8fafc')),
                                      color: isOrderPlaced
                                        ? '#b45309'
                                        : (isDispatched ? '#0369a1' : (isDelivered ? '#047857' : '#334155')),
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="ORDER_PLACED">⏳ Order Placed</option>
                                    <option value="PACKED">📦 Packed</option>
                                    <option value="DISPATCHED">🚚 Couriered / In Transit</option>
                                    <option value="OUT_FOR_DELIVERY">🛵 Out for Delivery</option>
                                    <option value="DELIVERED">✅ Delivered</option>
                                  </select>
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {/* Prominent Courier Button for ORDER_PLACED */}
                                    {isOrderPlaced && (
                                      <button
                                        type="button"
                                        onClick={() => setQuickDispatchOrder({
                                          ...o,
                                          fulfillment_status: 'DISPATCHED',
                                          courier_partner: o.courier_partner || 'BlueDart Express',
                                          tracking_number: o.tracking_number || `BLUEDART-IND-${Math.floor(1000000 + Math.random() * 9000000)}`,
                                          note: 'Package handed over to courier partner. Dispatched to recipient address.'
                                        })}
                                        style={{
                                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '5px 12px',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title="Mark order as couriered and assign tracking"
                                      >
                                        <Truck size={13} />
                                        <span>Mark Couriered</span>
                                      </button>
                                    )}

                                    {/* Mark Delivered button for DISPATCHED */}
                                    {isDispatched && (
                                      <button
                                        type="button"
                                        onClick={() => handleDirectOrderStatusChange(o.id, 'DELIVERED')}
                                        style={{
                                          background: '#d1fae5',
                                          color: '#047857',
                                          border: '1px solid #a7f3d0',
                                          padding: '5px 10px',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title="Mark order as delivered"
                                      >
                                        <CheckCircle2 size={13} />
                                        <span>Mark Delivered</span>
                                      </button>
                                    )}

                                    {/* Edit / Details Button */}
                                    <button
                                      type="button"
                                      onClick={() => setEditingOrder(o)}
                                      style={{
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        color: '#334155',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      title="Edit courier and fulfillment details"
                                    >
                                      <Edit size={12} />
                                      <span>Edit</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: GAME SETTINGS */}
          {/* TAB 5: SNAKE MECHANICS CONFIG (SIMPLIFIED & USER FRIENDLY) */}
          {activeTab === 'game' && (() => {
            const SPEED_LEVELS = [
              {
                id: 'SLOW',
                label: 'Slow',
                emoji: '🐢',
                badge: 'Casual',
                desc: 'Relaxed speed, beginner-friendly snake control.',
                base_speed: 140,
                min_speed: 65,
                acceleration_step: 2
              },
              {
                id: 'NORMAL',
                label: 'Normal',
                emoji: '🎯',
                badge: 'Classic (Recommended)',
                desc: 'Authentic Nokia 3310 arcade challenge pace.',
                base_speed: 110,
                min_speed: 40,
                acceleration_step: 3
              },
              {
                id: 'FAST',
                label: 'Fast',
                emoji: '⚡',
                badge: 'Competitive',
                desc: 'Rapid movement for high-stakes competition.',
                base_speed: 85,
                min_speed: 30,
                acceleration_step: 4
              },
              {
                id: 'EXTREME',
                label: 'Extreme',
                emoji: '🚀',
                badge: 'Pro Master',
                desc: 'Lightning speed for elite arcade reflex runs.',
                base_speed: 65,
                min_speed: 20,
                acceleration_step: 5
              }
            ];

            const currentSpeedId = (() => {
              const bs = gameSettings.base_speed || 110;
              if (bs >= 125) return 'SLOW';
              if (bs >= 95) return 'NORMAL';
              if (bs >= 75) return 'FAST';
              return 'EXTREME';
            })();

            const activeSpeedObj = SPEED_LEVELS.find(s => s.id === currentSpeedId) || SPEED_LEVELS[1];

            return (
              <div style={{ maxWidth: '840px' }}>
                {/* Header Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  color: '#ffffff',
                  marginBottom: '24px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                    flexShrink: 0
                  }}>
                    <Gamepad2 size={24} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                        Snake II Arena Gameplay Settings
                      </span>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        EASY CONTROL
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Configure snake game speed, normal apple catch points, and golden apple bonus mechanics for all contestants.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveGameSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* ========================================================
                      1. SPEED CONTROL (வேகக் கட்டுப்பாடு)
                     ======================================================== */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '22px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '800'
                          }}>
                            1
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                            Snake Game Speed Control
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginLeft: '32px' }}>
                          Select the desired gameplay speed. Controls how fast the snake travels across the grid.
                        </div>
                      </div>

                      <span style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>Active:</span>
                        <span>{activeSpeedObj.emoji} {activeSpeedObj.label}</span>
                      </span>
                    </div>

                    {/* Speed Preset Selection Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      marginLeft: '32px'
                    }}>
                      {SPEED_LEVELS.map((lvl) => {
                        const isSelected = lvl.id === currentSpeedId;
                        return (
                          <div
                            key={lvl.id}
                            onClick={() => {
                              setGameSettings({
                                ...gameSettings,
                                base_speed: lvl.base_speed,
                                min_speed: lvl.min_speed,
                                acceleration_step: lvl.acceleration_step
                              });
                            }}
                            style={{
                              border: isSelected ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                              background: isSelected ? '#f0f9ff' : '#ffffff',
                              borderRadius: '12px',
                              padding: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.18)' : 'none',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '26px' }}>{lvl.emoji}</span>
                              {isSelected && (
                                <span style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#0369a1' : '#0f172a' }}>
                              {lvl.label}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              fontSize: '10px',
                              fontWeight: '700',
                              color: isSelected ? '#0284c7' : '#64748b',
                              background: isSelected ? '#e0f2fe' : '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              marginTop: '2px',
                              marginBottom: '6px'
                            }}>
                              {lvl.badge}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.35' }}>
                              {lvl.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ========================================================
                      2. NORMAL & GOLDEN APPLE POINTS & DURATION
                     ======================================================== */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Normal Apple Points Card */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '22px' }}>🍎</span>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                              Normal Apple Points
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Points for catching regular red apple
                            </div>
                          </div>
                        </div>

                        <div style={{ margin: '14px 0' }}>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={gameSettings.normal_apple_points}
                            onChange={(e) => setGameSettings({ ...gameSettings, normal_apple_points: parseInt(e.target.value, 10) || 10 })}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '2px solid #cbd5e1',
                              fontSize: '22px',
                              fontWeight: '900',
                              color: '#0f172a',
                              background: '#f8fafc',
                              textAlign: 'center',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Presets for Normal Apple */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>
                          Quick Select Points:
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[5, 10, 15, 20].map((pts) => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setGameSettings({ ...gameSettings, normal_apple_points: pts })}
                              style={{
                                flex: 1,
                                padding: '6px 0',
                                borderRadius: '6px',
                                border: gameSettings.normal_apple_points === pts ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                background: gameSettings.normal_apple_points === pts ? '#0284c7' : '#f8fafc',
                                color: gameSettings.normal_apple_points === pts ? '#ffffff' : '#334155',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              +{pts}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Golden Apple Points Card */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1.5px solid #fef08a',
                      boxShadow: '0 2px 8px rgba(234, 179, 8, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '22px' }}>⭐</span>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#854d0e' }}>
                              Golden Apple Points
                            </div>
                            <div style={{ fontSize: '11px', color: '#a16207' }}>
                              Bonus points for rare flashing apple
                            </div>
                          </div>
                        </div>

                        <div style={{ margin: '14px 0' }}>
                          <input
                            type="number"
                            min="1"
                            max="5000"
                            value={gameSettings.golden_apple_points}
                            onChange={(e) => setGameSettings({ ...gameSettings, golden_apple_points: parseInt(e.target.value, 10) || 50 })}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '2px solid #fde047',
                              fontSize: '22px',
                              fontWeight: '900',
                              color: '#854d0e',
                              background: '#fefce8',
                              textAlign: 'center',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Presets for Golden Apple */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: '700', marginBottom: '6px' }}>
                          Quick Select Points:
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[25, 50, 75, 100].map((pts) => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setGameSettings({ ...gameSettings, golden_apple_points: pts })}
                              style={{
                                flex: 1,
                                padding: '6px 0',
                                borderRadius: '6px',
                                border: gameSettings.golden_apple_points === pts ? '1.5px solid #ca8a04' : '1px solid #fde047',
                                background: gameSettings.golden_apple_points === pts ? '#ca8a04' : '#fffbeb',
                                color: gameSettings.golden_apple_points === pts ? '#ffffff' : '#854d0e',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              +{pts}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Golden Apple Duration (Seconds) Card */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '22px' }}>⏱️</span>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                              Golden Apple Duration
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Active countdown before disappearing
                            </div>
                          </div>
                        </div>

                        <div style={{ margin: '14px 0' }}>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min="2"
                              max="60"
                              value={gameSettings.golden_apple_duration_sec}
                              onChange={(e) => setGameSettings({ ...gameSettings, golden_apple_duration_sec: parseInt(e.target.value, 10) || 7 })}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '2px solid #cbd5e1',
                                fontSize: '22px',
                                fontWeight: '900',
                                color: '#0f172a',
                                background: '#f8fafc',
                                textAlign: 'center',
                                boxSizing: 'border-box'
                              }}
                            />
                            <span style={{
                              position: 'absolute',
                              right: '14px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#64748b'
                            }}>
                              seconds
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets for Duration */}
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>
                          Quick Select Timer:
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[5, 7, 10, 15].map((secs) => (
                            <button
                              key={secs}
                              type="button"
                              onClick={() => setGameSettings({ ...gameSettings, golden_apple_duration_sec: secs })}
                              style={{
                                flex: 1,
                                padding: '6px 0',
                                borderRadius: '6px',
                                border: gameSettings.golden_apple_duration_sec === secs ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                background: gameSettings.golden_apple_duration_sec === secs ? '#0284c7' : '#f8fafc',
                                color: gameSettings.golden_apple_duration_sec === secs ? '#ffffff' : '#334155',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {secs}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================
                      3. LIVE GAME CONFIG SUMMARY & SAVE ACTION
                     ======================================================== */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '18px 24px',
                    border: '1.5px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Active Configuration Preview:
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>
                          Speed: <strong style={{ color: '#0284c7' }}>{activeSpeedObj.emoji} {activeSpeedObj.label}</strong>
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>
                          Red Apple: <strong style={{ color: '#059669' }}>+{gameSettings.normal_apple_points} pts</strong>
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>
                          Golden Apple: <strong style={{ color: '#d97706' }}>+{gameSettings.golden_apple_points} pts</strong> ({gameSettings.golden_apple_duration_sec}s)
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '14px',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <Save size={16} />
                      <span>Save Game Configuration to DB</span>
                    </button>
                  </div>

                  {/* ========================================================
                      4. OPTIONAL ADVANCED TECHNICAL PARAMS (COLLAPSIBLE)
                     ======================================================== */}
                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedGameSettings(!showAdvancedGameSettings)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <SlidersHorizontal size={14} />
                      <span>{showAdvancedGameSettings ? 'Hide Advanced Technical Parameters' : 'Show Advanced Technical Parameters (ms per tick, acceleration)'}</span>
                      {showAdvancedGameSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showAdvancedGameSettings && (
                      <div style={{
                        marginTop: '12px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'left',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        animation: 'fadeIn 0.15s ease-out'
                      }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Base Speed (ms / tick)</label>
                          <input
                            type="number"
                            value={gameSettings.base_speed}
                            onChange={(e) => setGameSettings({ ...gameSettings, base_speed: parseInt(e.target.value, 10) || 110 })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '4px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Min Speed Ceiling (ms)</label>
                          <input
                            type="number"
                            value={gameSettings.min_speed}
                            onChange={(e) => setGameSettings({ ...gameSettings, min_speed: parseInt(e.target.value, 10) || 40 })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '4px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Acceleration Step (ms)</label>
                          <input
                            type="number"
                            value={gameSettings.acceleration_step}
                            onChange={(e) => setGameSettings({ ...gameSettings, acceleration_step: parseInt(e.target.value, 10) || 3 })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '4px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Golden Apple Spawn Chance</label>
                          <input
                            type="number"
                            step="0.05"
                            value={gameSettings.golden_apple_chance}
                            onChange={(e) => setGameSettings({ ...gameSettings, golden_apple_chance: parseFloat(e.target.value) || 0.25 })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginTop: '4px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            );
          })()}

          {/* TAB 6: USERS & RBAC (ADMIN / SUPER ADMIN) */}
          {activeTab === 'users' && isAdmin && (() => {
            const ROLE_DEFINITIONS = [
              {
                role: 'Super Admin',
                title: 'Super Administrator',
                badgeBg: '#fef3c7',
                badgeBorder: '#fcd34d',
                badgeColor: '#92400e',
                accentColor: '#f59e0b',
                icon: '👑',
                level: 'Full Unrestricted Access (System Owner)',
                summary: 'Full platform authority. Can assign and revoke any user role, configure game physics, audit financial revenue, and manage all contests.',
                keyPermissions: [
                  'Manage User Roles & RBAC (Assign / Revoke privileges)',
                  'Create, Edit, Conclude & Showcase Challenges',
                  'Declare Grand Prize Champions & Conclude Contests',
                  'View Full Contestant Rosters, High Scores & Addresses',
                  'Manage Guaranteed Apparel Gifts & Variants',
                  'Update Logistics & BlueDart Tracking Numbers',
                  'Configure Snake Game Physics & Speed Settings',
                  'Audit Gross Collections, Paid Entries & Financial Analytics'
                ],
                flags: {
                  rbac: true,
                  challenges: true,
                  declareWinner: true,
                  contestants: true,
                  gifts: true,
                  logistics: true,
                  gameConfig: true,
                  financials: true,
                  playGame: true
                }
              },
              {
                role: 'Admin',
                title: 'System Administrator',
                badgeBg: '#e0f2fe',
                badgeBorder: '#bae6fd',
                badgeColor: '#0369a1',
                accentColor: '#0284c7',
                icon: '🛡️',
                level: 'Operations & Management',
                summary: 'Platform administrator. Can oversee tournament arenas, manage gifts and logistics, configure game mechanics, and inspect revenue statistics.',
                keyPermissions: [
                  'View User Directory & Account Profiles',
                  'Create, Edit, Conclude & Showcase Challenges',
                  'Declare Grand Prize Champions & Conclude Contests',
                  'View Full Contestant Rosters, High Scores & Addresses',
                  'Manage Guaranteed Apparel Gifts & Stock Options',
                  'Update Logistics & BlueDart Tracking Numbers',
                  'Configure Snake Game Physics & Speed Settings',
                  'View Financial Collections & Revenue Summaries'
                ],
                flags: {
                  rbac: false,
                  challenges: true,
                  declareWinner: true,
                  contestants: true,
                  gifts: true,
                  logistics: true,
                  gameConfig: true,
                  financials: true,
                  playGame: true
                }
              },
              {
                role: 'Manager',
                title: 'Tournament Operations Manager',
                badgeBg: '#ecfdf5',
                badgeBorder: '#a7f3d0',
                badgeColor: '#065f46',
                accentColor: '#10b981',
                icon: '🏆',
                level: 'Contest & Prize Operations',
                summary: 'Arena manager. Dedicated to tournament lifecycle, monitoring slot occupancy, contestant roster with scores & addresses, and declaring champions.',
                keyPermissions: [
                  'Create, Edit & Activate Tournament Challenges',
                  'Set Homepage Hero Showcase Challenge',
                  'View Joined Contestants by Competition & Scores',
                  'Declare Tournament Champions on Leaderboard',
                  'Manage Guaranteed Apparel Gifts & Stock Options',
                  'Tune Snake Mechanics (Speed, Apples, Durations)'
                ],
                flags: {
                  rbac: false,
                  challenges: true,
                  declareWinner: true,
                  contestants: true,
                  gifts: true,
                  logistics: false,
                  gameConfig: true,
                  financials: false,
                  playGame: true
                }
              },
              {
                role: 'Accountant',
                title: 'Financial Auditor',
                badgeBg: '#f3e8ff',
                badgeBorder: '#d8b4fe',
                badgeColor: '#6b21a8',
                accentColor: '#9333ea',
                icon: '💰',
                level: 'Financial Audit & Revenue',
                summary: 'Finance & accounting. Has dedicated access to platform financial analytics, gross collections from ₹1,000 entries, paid entry verification, and gift MRP audit.',
                keyPermissions: [
                  'Executive Dashboard Overview & Revenue Stats',
                  'Full Access to Financial Revenue & Collections Audit',
                  'Gross Entry Collections (₹1,000 Entries Audit)',
                  'Paid Verified Entries Count & Gift MRP Totals',
                  'Per-Tournament Revenue Audit'
                ],
                flags: {
                  rbac: false,
                  challenges: false,
                  declareWinner: false,
                  contestants: false,
                  gifts: false,
                  logistics: false,
                  gameConfig: false,
                  financials: true,
                  playGame: true
                }
              },
              {
                role: 'Support',
                title: 'Customer Support & Logistics',
                badgeBg: '#ffedd5',
                badgeBorder: '#fed7aa',
                badgeColor: '#9a3412',
                accentColor: '#f97316',
                icon: '🚚',
                level: 'Logistics & Dispatch Operations',
                summary: 'Customer support & dispatches team. Responsible for order dispatches, assigning courier partners (e.g. BlueDart), entering tracking numbers, and resolving delivery issues.',
                keyPermissions: [
                  'View All User Orders & Guaranteed Gift Dispatches',
                  'Update Fulfillment Status (Processing, In Transit, Delivered)',
                  'Assign Courier Partner (BlueDart, Delhivery, etc.)',
                  'Enter and Update Courier AWB / Tracking Numbers',
                  'Add Internal Courier Dispatch & Delivery Notes'
                ],
                flags: {
                  rbac: false,
                  challenges: false,
                  declareWinner: false,
                  contestants: false,
                  gifts: false,
                  logistics: true,
                  gameConfig: false,
                  financials: false,
                  playGame: true
                }
              },
              {
                role: 'Users',
                title: 'Player / Contestant',
                badgeBg: '#f1f5f9',
                badgeBorder: '#cbd5e1',
                badgeColor: '#334155',
                accentColor: '#64748b',
                icon: '👤',
                level: 'Player / Contestant Only',
                summary: 'Standard player account. Can browse tournaments, pay ₹1,000 entry fees, pick guaranteed gifts with size/color, compete in the 5-day Snake arena, and submit scores.',
                keyPermissions: [
                  'Browse Active 5-Day Challenges & Prize Pools',
                  'Pay ₹1,000 Entry Fee to Join Active Arenas',
                  'Select Guaranteed Apparel Gift with Custom Size & Color',
                  'Play Snake II Arena Game & Submit High Scores',
                  'View Live Public Leaderboard & Prize Deliveries',
                  'Manage User Profile & Shipping Delivery Address'
                ],
                flags: {
                  rbac: false,
                  challenges: false,
                  declareWinner: false,
                  contestants: false,
                  gifts: false,
                  logistics: false,
                  gameConfig: false,
                  financials: false,
                  playGame: true
                }
              }
            ];

            const PERMISSION_CAPABILITIES = [
              { key: 'rbac', label: 'User Roles & RBAC Management', desc: 'Can assign and modify user roles in system' },
              { key: 'challenges', label: 'Manage Challenges & Hero Showcase', desc: 'Create, edit, activate/deactivate tournaments' },
              { key: 'declareWinner', label: 'Declare Champions & Conclude Contests', desc: 'Step 7 winner declaration & prize allocation' },
              { key: 'contestants', label: 'Joined Contestants Roster & Scores', desc: 'View player list, scores, gifts & addresses' },
              { key: 'gifts', label: 'Guaranteed Apparel Gifts & Variants', desc: 'Edit gift catalog, size and color options' },
              { key: 'logistics', label: 'Logistics & BlueDart Tracking Numbers', desc: 'Update dispatches, courier partners & AWB' },
              { key: 'gameConfig', label: 'Snake Mechanics & Speed Thresholds', desc: 'Configure game speed, apple points & durations' },
              { key: 'financials', label: 'Financial Analytics & Revenue Audit', desc: 'Audit gross collections, entry fees & margins' },
              { key: 'playGame', label: 'Join Challenges & Play Snake Arena', desc: 'Standard player gameplay & leaderboard access' }
            ];

            const roleCounts = {
              ALL: usersList.length,
              'Super Admin': usersList.filter(u => u.role === 'Super Admin').length,
              'Admin': usersList.filter(u => u.role === 'Admin').length,
              'Manager': usersList.filter(u => u.role === 'Manager').length,
              'Accountant': usersList.filter(u => u.role === 'Accountant').length,
              'Support': usersList.filter(u => u.role === 'Support').length,
              'Users': usersList.filter(u => u.role === 'Users' || !u.role).length,
              blocked: usersList.filter(u => u.is_blocked).length,
              active: usersList.filter(u => !u.is_blocked).length
            };

            const filteredUsersList = usersList.filter((u) => {
              const q = userSearch.toLowerCase().trim();
              const matchesSearch = !q || 
                (u.name && u.name.toLowerCase().includes(q)) ||
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.city && u.city.toLowerCase().includes(q)) ||
                (u.role && u.role.toLowerCase().includes(q)) ||
                (u.id && String(u.id).includes(q));
              const currentRole = u.role || 'Users';
              const matchesRole = userRoleFilter === 'ALL' || currentRole === userRoleFilter;
              const matchesStatus = userAccountStatusFilter === 'ALL' ||
                (userAccountStatusFilter === 'BLOCKED' && u.is_blocked) ||
                (userAccountStatusFilter === 'ACTIVE' && !u.is_blocked);
              return matchesSearch && matchesRole && matchesStatus;
            });


            const getRoleHelperText = (roleName) => {
              switch(roleName) {
                case 'Super Admin': return 'Full Platform Authority & Role Assignment';
                case 'Admin': return 'Tournament Ops, Gifts, Dispatches & Mechanics';
                case 'Manager': return 'Challenges, Contestants Roster, Gifts & Winners';
                case 'Accountant': return 'Financial Analytics & Gross Revenue Audit';
                case 'Support': return 'Logistics, Dispatches & BlueDart AWB';
                case 'Users':
                default: return 'Standard Player — 5-Day Snake Arena & Claims';
              }
            };

            return (
              <div>
                {/* 1. TOP HEADER & RBAC GUIDE TRIGGER */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  color: '#ffffff',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ maxWidth: '640px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        RBAC ACCESS CONTROL
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Total Registered Users: <strong>{usersList.length}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff' }}>
                      User Management & Role Permissions Directory
                    </h3>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.5' }}>
                      Assign roles with confidence. Click <strong>RBAC Permissions Guide</strong> to see precisely what permissions, features, and capabilities each role can access.
                    </div>
                  </div>

                  {/* Toggle Guide Button */}
                  <button
                    type="button"
                    onClick={() => setShowRbacGuide(!showRbacGuide)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: showRbacGuide ? '#0284c7' : 'rgba(255, 255, 255, 0.1)',
                      border: showRbacGuide ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: showRbacGuide ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none'
                    }}
                  >
                    <Shield size={16} color="#38bdf8" />
                    <span>{showRbacGuide ? 'Hide Permissions Guide' : 'View Role Permissions & Matrix'}</span>
                    {showRbacGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* 2. EXPANDABLE RBAC PERMISSIONS GUIDE CARD */}
                {showRbacGuide && (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1.5px solid #0284c7',
                    boxShadow: '0 10px 30px rgba(2, 132, 199, 0.12)',
                    padding: '20px',
                    marginBottom: '24px',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    {/* Sub-header with tabs */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '14px',
                      marginBottom: '18px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '800'
                        }}>
                          <Shield size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            Platform Role-Based Access Control (RBAC) Specification
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Official breakdown of all 6 platform roles and their access boundaries
                          </div>
                        </div>
                      </div>

                      {/* View Switcher: Cards vs Matrix */}
                      <div style={{
                        display: 'flex',
                        background: '#f1f5f9',
                        padding: '3px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1'
                      }}>
                        <button
                          type="button"
                          onClick={() => setRbacGuideTab('cards')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: rbacGuideTab === 'cards' ? '#ffffff' : 'transparent',
                            color: rbacGuideTab === 'cards' ? '#0284c7' : '#64748b',
                            boxShadow: rbacGuideTab === 'cards' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          Role Breakdown Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setRbacGuideTab('matrix')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: rbacGuideTab === 'matrix' ? '#ffffff' : 'transparent',
                            color: rbacGuideTab === 'matrix' ? '#0284c7' : '#64748b',
                            boxShadow: rbacGuideTab === 'matrix' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          Full Permissions Matrix Table
                        </button>
                      </div>
                    </div>

                    {/* VIEW A: ROLE BREAKDOWN CARDS */}
                    {rbacGuideTab === 'cards' && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '14px'
                      }}>
                        {ROLE_DEFINITIONS.map((def) => {
                          const count = roleCounts[def.role] || 0;
                          return (
                            <div
                              key={def.role}
                              style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: `1.5px solid ${def.badgeBorder}`,
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                              }}
                            >
                              <div>
                                {/* Card Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>{def.icon}</span>
                                    <div>
                                      <div style={{
                                        fontSize: '14px',
                                        fontWeight: '800',
                                        color: def.badgeColor,
                                        display: 'inline-block'
                                      }}>
                                        {def.title}
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>
                                        {def.level}
                                      </div>
                                    </div>
                                  </div>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: '#ffffff',
                                    border: `1px solid ${def.badgeBorder}`,
                                    color: def.badgeColor,
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                  }}>
                                    {count} {count === 1 ? 'User' : 'Users'}
                                  </span>
                                </div>

                                {/* Summary */}
                                <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: '1.45', margin: '0 0 12px 0' }}>
                                  {def.summary}
                                </p>

                                {/* Permissions Checklist */}
                                <div style={{
                                  background: '#ffffff',
                                  borderRadius: '8px',
                                  padding: '10px 12px',
                                  border: '1px solid #e2e8f0',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    color: '#64748b',
                                    letterSpacing: '0.05em',
                                    marginBottom: '6px'
                                  }}>
                                    Granted Capabilities:
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {def.keyPermissions.map((perm, pIdx) => (
                                      <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#1e293b' }}>
                                        <Check size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>{perm}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer Badge */}
                              <div style={{
                                paddingTop: '8px',
                                borderTop: '1px dashed #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                color: '#64748b'
                              }}>
                                <span>Role Code: <strong>{def.role}</strong></span>
                                {def.flags.rbac && (
                                  <span style={{ color: '#d97706', fontWeight: '800', fontSize: '10px' }}>
                                    🔒 CAN ASSIGN ROLES
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* VIEW B: PERMISSIONS MATRIX TABLE */}
                    {rbacGuideTab === 'matrix' && (
                      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'center' }}>
                              <th style={{ padding: '12px 14px', textAlign: 'left', minWidth: '220px' }}>
                                Platform Feature / Capability
                              </th>
                              {ROLE_DEFINITIONS.map(r => (
                                <th key={r.role} style={{ padding: '10px 12px', minWidth: '100px' }}>
                                  <div style={{ fontSize: '14px' }}>{r.icon}</div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>{r.role}</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {PERMISSION_CAPABILITIES.map((cap, cIdx) => (
                              <tr
                                key={cap.key}
                                style={{
                                  background: cIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                  borderBottom: '1px solid #e2e8f0'
                                }}
                              >
                                <td style={{ padding: '10px 14px', textAlign: 'left' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{cap.label}</div>
                                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>{cap.desc}</div>
                                </td>
                                {ROLE_DEFINITIONS.map(r => {
                                  const isAllowed = r.flags[cap.key];
                                  return (
                                    <td key={r.role} style={{ padding: '10px 8px', textAlign: 'center' }}>
                                      {isAllowed ? (
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          background: '#ecfdf5',
                                          color: '#059669',
                                          padding: '3px 8px',
                                          borderRadius: '6px',
                                          fontWeight: '800',
                                          fontSize: '11px',
                                          border: '1px solid #a7f3d0'
                                        }}>
                                          <Check size={12} strokeWidth={3} />
                                          <span>Allowed</span>
                                        </span>
                                      ) : (
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          background: '#f1f5f9',
                                          color: '#94a3b8',
                                          padding: '3px 7px',
                                          borderRadius: '6px',
                                          fontWeight: '700',
                                          fontSize: '10.5px'
                                        }}>
                                          ✕ No Access
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. USER SEARCH & ROLE FILTER BAR */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                      <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search user by name, email, city, or current role..."
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {userSearch && (
                        <button
                          type="button"
                          onClick={() => setUserSearch('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>
                      Showing <strong>{filteredUsersList.length}</strong> of {usersList.length} Accounts
                    </div>
                  </div>

                    {/* Role Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>
                        Filter by Role:
                      </span>
                      {[
                        { id: 'ALL', label: `All (${roleCounts.ALL})` },
                        { id: 'Super Admin', label: `👑 Super Admin (${roleCounts['Super Admin']})`, color: '#f59e0b' },
                        { id: 'Admin', label: `🛡️ Admin (${roleCounts['Admin']})`, color: '#0284c7' },
                        { id: 'Manager', label: `🏆 Manager (${roleCounts['Manager']})`, color: '#10b981' },
                        { id: 'Accountant', label: `💰 Accountant (${roleCounts['Accountant']})`, color: '#9333ea' },
                        { id: 'Support', label: `🚚 Support (${roleCounts['Support']})`, color: '#f97316' },
                        { id: 'Users', label: `👤 Users (${roleCounts['Users']})`, color: '#64748b' }
                      ].map((rf) => (
                        <button
                          key={rf.id}
                          type="button"
                          onClick={() => setUserRoleFilter(rf.id)}
                          style={{
                            background: userRoleFilter === rf.id ? '#0f172a' : '#f1f5f9',
                            color: userRoleFilter === rf.id ? '#ffffff' : '#334155',
                            border: userRoleFilter === rf.id ? '1px solid #0f172a' : '1px solid transparent',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {rf.label}
                        </button>
                      ))}
                    </div>

                    {/* Account Moderation Status Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginRight: '4px' }}>
                        Account Status:
                      </span>
                      {[
                        { id: 'ALL', label: `All Users (${usersList.length})` },
                        { id: 'ACTIVE', label: `✅ Active (${roleCounts.active})` },
                        { id: 'BLOCKED', label: `⛔ Blocked / Suspended (${roleCounts.blocked})` }
                      ].map((sf) => (
                        <button
                          key={sf.id}
                          type="button"
                          onClick={() => setUserAccountStatusFilter(sf.id)}
                          style={{
                            background: userAccountStatusFilter === sf.id 
                              ? (sf.id === 'BLOCKED' ? '#ef4444' : (sf.id === 'ACTIVE' ? '#10b981' : '#0f172a')) 
                              : '#f1f5f9',
                            color: userAccountStatusFilter === sf.id ? '#ffffff' : '#334155',
                            border: 'none',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {sf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Select Sticky Batch Action Bar */}
                  {selectedUserIds.length > 0 && (
                    <div style={{
                      position: 'sticky',
                      top: '10px',
                      zIndex: 60,
                      background: 'linear-gradient(135deg, #0b1120 0%, #1e293b 100%)',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                      border: '1.5px solid #0284c7',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px',
                      animation: 'fadeIn 0.15s ease-out'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '900',
                          letterSpacing: '0.5px'
                        }}>
                          {selectedUserIds.length} SELECTED
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>
                          Batch Moderation on Selected Accounts
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleBulkBlockUsers(true, 'Administrative bulk block')}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                          }}
                        >
                          <span>🚫 Block Selected ({selectedUserIds.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBulkBlockUsers(false)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                          }}
                        >
                          <span>✅ Unblock Selected ({selectedUserIds.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedUserIds([])}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#cbd5e1',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. USER DIRECTORY TABLE */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                            {/* Multi-Select Header Checkbox */}
                            <th style={{ padding: '12px 14px', width: '36px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={filteredUsersList.length > 0 && selectedUserIds.length === filteredUsersList.filter(u => u.id !== user?.id).length}
                                onChange={() => handleSelectAllUsers(filteredUsersList)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                title="Select All Filtered Accounts"
                              />
                            </th>
                            <th style={{ padding: '12px 14px' }}>User Profile</th>
                            <th style={{ padding: '12px 14px' }}>Email & Phone</th>
                            <th style={{ padding: '12px 14px' }}>Location</th>
                            <th style={{ padding: '12px 14px' }}>Current Role & Privileges</th>
                            <th style={{ padding: '12px 14px' }}>Platform Activity</th>
                            <th style={{ padding: '12px 14px' }}>Account Status & Moderation</th>
                            {isSuperAdmin && (
                              <th style={{ padding: '12px 14px', textAlign: 'right', minWidth: '240px' }}>
                                Change Role (Assign Permissions)
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsersList.length === 0 ? (
                            <tr>
                              <td colSpan={isSuperAdmin ? 8 : 7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                                No users found matching your search, role, or moderation status filter.
                              </td>
                            </tr>
                          ) : (
                            filteredUsersList.map((u) => {
                              const userRole = u.role || 'Users';
                              const roleDef = ROLE_DEFINITIONS.find(r => r.role === userRole) || ROLE_DEFINITIONS[5];
                              const isSelf = u.id === user?.id;

                              return (
                                <tr
                                  key={u.id}
                                  style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    background: u.is_blocked ? '#fef2f2' : (selectedUserIds.includes(u.id) ? '#f0f9ff' : 'transparent'),
                                    transition: 'background 0.1s ease'
                                  }}
                                  onMouseOver={(e) => {
                                    if (!u.is_blocked && !selectedUserIds.includes(u.id)) {
                                      e.currentTarget.style.background = '#fbfcfe';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    if (!u.is_blocked && !selectedUserIds.includes(u.id)) {
                                      e.currentTarget.style.background = 'transparent';
                                    }
                                  }}
                                >
                                  {/* Row Selection Checkbox */}
                                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedUserIds.includes(u.id)}
                                      disabled={isSelf}
                                      onChange={() => handleSelectUser(u.id)}
                                      style={{ width: '16px', height: '16px', cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                      title={isSelf ? 'Cannot select your own account' : 'Select user for bulk action'}
                                    />
                                  </td>

                                  {/* Name with initial avatar */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '10px',
                                        background: u.is_blocked ? '#fee2e2' : roleDef.badgeBg,
                                        border: `1px solid ${u.is_blocked ? '#fca5a5' : roleDef.badgeBorder}`,
                                        color: u.is_blocked ? '#b91c1c' : roleDef.badgeColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        flexShrink: 0
                                      }}>
                                        {u.name ? u.name[0].toUpperCase() : 'U'}
                                      </div>
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontWeight: '800', color: '#0f172a' }}>{u.name}</span>
                                          {u.is_blocked && (
                                            <span style={{
                                              fontSize: '9px',
                                              fontWeight: '900',
                                              background: '#ef4444',
                                              color: '#ffffff',
                                              padding: '1px 5px',
                                              borderRadius: '4px'
                                            }}>
                                              BLOCKED
                                            </span>
                                          )}
                                          {isSelf && (
                                            <span style={{ fontSize: '9px', fontWeight: '800', background: '#e0f2fe', color: '#0284c7', padding: '1px 5px', borderRadius: '4px' }}>
                                              YOU
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: #{u.id}</div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Email & Phone */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ color: '#334155', fontWeight: '600' }}>{u.email}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      {u.phone || 'Phone not set'}
                                    </div>
                                  </td>

                                  {/* Location */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '3px 8px',
                                      background: '#f1f5f9',
                                      borderRadius: '6px',
                                      fontSize: '11.5px',
                                      color: '#475569',
                                      fontWeight: '600'
                                    }}>
                                      {u.city || 'Not Provided'}
                                    </span>
                                  </td>

                                  {/* Role Badge & Permissions Summary */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: roleDef.badgeBg,
                                        border: `1px solid ${roleDef.badgeBorder}`,
                                        color: roleDef.badgeColor,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <span>{roleDef.icon}</span>
                                        <span>{userRole}</span>
                                      </span>

                                      {/* Info popup button */}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedRoleModal(roleDef)}
                                        title={`View full permissions for ${userRole}`}
                                        style={{
                                          background: '#f1f5f9',
                                          border: '1px solid #cbd5e1',
                                          color: '#0284c7',
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '50%',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          padding: 0
                                        }}
                                      >
                                        <Info size={12} />
                                      </button>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                      {getRoleHelperText(userRole)}
                                    </div>
                                  </td>

                                  {/* Platform Activity */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ fontSize: '12px', color: '#334155' }}>
                                      Entries: <strong>{u.entries_count || 0}</strong>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      Gifts Claimed: {u.orders_count || 0}
                                    </div>
                                  </td>

                                  {/* Account Status & Moderation (Block/Unblock) */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      {u.is_blocked ? (
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          background: '#fee2e2',
                                          color: '#b91c1c',
                                          border: '1px solid #fecaca',
                                          padding: '3px 8px',
                                          borderRadius: '6px'
                                        }}>
                                          <span>⛔ Blocked</span>
                                        </span>
                                      ) : (
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          background: '#ecfdf5',
                                          color: '#047857',
                                          border: '1px solid #a7f3d0',
                                          padding: '3px 8px',
                                          borderRadius: '6px'
                                        }}>
                                          <span>✅ Active</span>
                                        </span>
                                      )}

                                      {/* Block / Unblock Action Button */}
                                      {!isSelf ? (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBlockUser(u, !u.is_blocked)}
                                          style={{
                                            background: u.is_blocked ? '#10b981' : '#fee2e2',
                                            color: u.is_blocked ? '#ffffff' : '#b91c1c',
                                            border: u.is_blocked ? 'none' : '1px solid #fca5a5',
                                            padding: '4px 9px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            boxShadow: u.is_blocked ? '0 1px 4px rgba(16, 185, 129, 0.3)' : 'none',
                                            transition: 'all 0.15s ease'
                                          }}
                                          title={u.is_blocked ? 'Reactivate and unblock account' : 'Suspend and block user'}
                                        >
                                          {u.is_blocked ? '✅ Unblock' : '🚫 Block'}
                                        </button>
                                      ) : (
                                        <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                                          Protected
                                        </span>
                                      )}
                                    </div>
                                    {u.is_blocked && u.blocked_reason && (
                                      <div style={{ fontSize: '10px', color: '#b91c1c', marginTop: '3px', maxWidth: '220px', lineHeight: 1.3 }}>
                                        {u.blocked_reason}
                                      </div>
                                    )}
                                  </td>

                                  {/* Change Role (Super Admin Only) */}
                                  {isSuperAdmin && (
                                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                      <div style={{ display: 'inline-block', textAlign: 'left', width: '100%', maxWidth: '280px' }}>
                                        <select
                                          value={userRole}
                                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                          style={{
                                            width: '100%',
                                            padding: '7px 10px',
                                            borderRadius: '8px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: '#0f172a',
                                            background: '#ffffff',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <option value="Super Admin">👑 Super Admin — Full System Access</option>
                                          <option value="Admin">🛡️ Admin — Operations & Management</option>
                                          <option value="Manager">🏆 Manager — Challenges, Contestants & Gifts</option>
                                          <option value="Accountant">💰 Accountant — Financial Audit & Revenue</option>
                                          <option value="Support">🚚 Support — Logistics & BlueDart Tracking</option>
                                          <option value="Users">👤 Users — Player / Contestant App Only</option>
                                        </select>
                                        <div style={{
                                          fontSize: '10.5px',
                                          color: '#0369a1',
                                          fontWeight: '600',
                                          marginTop: '4px',
                                          textAlign: 'right'
                                        }}>
                                          {userRole === 'Super Admin' && '✓ Full platform control granted'}
                                          {userRole === 'Admin' && '✓ Can manage tournaments, gifts & orders'}
                                          {userRole === 'Manager' && '✓ Can edit contests, view users & gifts'}
                                          {userRole === 'Accountant' && '✓ Can view revenue audit & collections'}
                                          {userRole === 'Support' && '✓ Can update orders & BlueDart AWB'}
                                          {userRole === 'Users' && '• Standard player account only'}
                                        </div>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>


                {/* 5. ROLE PERMISSION DETAILS MODAL (POPUP) */}
                {selectedRoleModal && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(11, 17, 32, 0.75)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: '16px'
                  }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '540px',
                      width: '100%',
                      padding: '24px',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                      border: '1px solid #e2e8f0',
                      animation: 'fadeIn 0.15s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '28px' }}>{selectedRoleModal.icon}</span>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: selectedRoleModal.badgeColor }}>
                              {selectedRoleModal.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                              {selectedRoleModal.level}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRoleModal(null)}
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            color: '#475569',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div style={{
                        background: '#f8fafc',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${selectedRoleModal.badgeBorder}`,
                        fontSize: '12.5px',
                        color: '#334155',
                        lineHeight: '1.5',
                        marginBottom: '16px'
                      }}>
                        {selectedRoleModal.summary}
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                          Granted Platform Capabilities:
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          maxHeight: '260px',
                          overflowY: 'auto'
                        }}>
                          {selectedRoleModal.keyPermissions.map((kp, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#0f172a'
                              }}
                            >
                              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                              <span>{kp}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRoleModal(null)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#0f172a',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '13px',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Close Specification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 7: FINANCIALS (ACCOUNTANT / ADMIN) */}
          {activeTab === 'financials' && isAccountant && financials && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>
                Financial Revenue & Collections Audit
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#ecfdf5', padding: '18px', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46' }}>GROSS COLLECTIONS (₹1,000 Entries)</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                    ₹{Number(financials.summary?.gross_entry_collections || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#fef3c7', padding: '18px', borderRadius: '14px', border: '1px solid #fcd34d' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>PAID VERIFIED ENTRIES</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#b45309', marginTop: '4px' }}>
                    {financials.summary?.total_paid_entries || 0}
                  </div>
                </div>

                <div style={{ background: '#f0f9ff', padding: '18px', borderRadius: '14px', border: '1px solid #bae6fd' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>TOTAL GUARANTEED GIFTS MRP</div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
                    ₹{Number(financials.summary?.estimated_gift_mrp_value || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px' }}>Collections per Tournament:</h4>
              <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Tournament</th>
                      <th style={{ padding: '8px 12px' }}>Entry Fee</th>
                      <th style={{ padding: '8px 12px' }}>Slots Filled</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Revenue Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financials.perTournament?.map((pt) => (
                      <tr key={pt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '700' }}>{pt.title}</td>
                        <td style={{ padding: '8px 12px' }}>₹{Number(pt.entry_fee).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 12px' }}>{pt.slots_filled} / {pt.total_slots}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                          ₹{Number(pt.total_collected).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: APPLICATION SETTINGS & BRANDING (SUPER ADMIN) */}
          {activeTab === 'app_settings' && (
            <AppSettingsView
              appSettings={currentSettings}
              user={user}
              notify={notify}
              onUpdateSettings={(newSettings) => {
                setCurrentSettings(newSettings);
                if (onUpdateAppSettings) onUpdateAppSettings(newSettings);
                if (onRefreshData) onRefreshData();
              }}
            />
          )}
        </div>
      </main>


      {/* Responsive Styles & Animations */}
      <style>{`
        @media (max-width: 900px) {
          .admin-portal-sidebar {
            position: absolute !important;
            top: 0;
            bottom: 0;
            left: 0;
            height: 100% !important;
            transform: translateX(-100%);
            box-shadow: 6px 0 30px rgba(0,0,0,0.5);
          }
          .admin-portal-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-sidebar-mobile-close {
            display: block !important;
          }
          .admin-mobile-menu-btn {
            display: flex !important;
          }
        }
        .spin-anim {
          animation: adminSpin 1s linear infinite;
        }
        @keyframes adminSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);
}
