import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Image, Upload, Shield, ShoppingBag, Trophy, Gamepad2,
  Sparkles, Crown, Zap, Target, Flame, Save, RefreshCw, CheckCircle2,
  AlertTriangle, Phone, Mail, MapPin, Truck, Calendar, DollarSign,
  Lock, Eye, Globe, Info, Trash2
} from 'lucide-react';
import { api } from '../services/api';

const AVAILABLE_ICONS = [
  { id: 'ShoppingBag', name: 'Shopping Bag', icon: ShoppingBag },
  { id: 'Shield', name: 'Security Shield', icon: Shield },
  { id: 'Trophy', name: 'Victory Trophy', icon: Trophy },
  { id: 'Gamepad2', name: 'Arcade Gamepad', icon: Gamepad2 },
  { id: 'Crown', name: 'Royal Crown', icon: Crown },
  { id: 'Sparkles', name: 'Sparkles', icon: Sparkles },
  { id: 'Zap', name: 'Electric Zap', icon: Zap },
  { id: 'Target', name: 'Bullseye Target', icon: Target },
  { id: 'Flame', name: 'Energy Flame', icon: Flame },
];

export default function AppSettingsView({
  appSettings = {},
  onUpdateSettings,
  notify,
  user
}) {
  const [formData, setFormData] = useState({
    app_name: 'WinArena',
    app_tagline: 'Skill-Based Competitions & Guaranteed Apparel Rewards',
    logo_url: '',
    logo_icon: 'ShoppingBag',
    admin_header_title: 'WinArena',
    admin_header_badge: 'CONTROL',
    admin_header_subtitle: 'Operations & Ops Console',
    support_email: 'support@winarena.com',
    support_phone: '+91 97711 22334',
    support_whatsapp: '+91 97711 22334',
    office_address: 'Level 4, Prestige Tech Park, Outer Ring Road, Bengaluru - 560103',
    currency_symbol: '₹',
    currency_code: 'INR',
    default_challenge_days: 5,
    default_entry_fee: 1000,
    default_courier_partner: 'BlueDart Express',
    allow_registrations: true,
    maintenance_mode: false,
    enable_guaranteed_gifts: true,
    footer_copyright_text: '© 2026 WinArena Technologies. All rights reserved.'
  });

  const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'defaults', 'contact', 'security'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Sync initial settings from prop or fetch from API
  useEffect(() => {
    if (appSettings && Object.keys(appSettings).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...appSettings,
        default_entry_fee: Number(appSettings.default_entry_fee || 1000),
        default_challenge_days: Number(appSettings.default_challenge_days || 5)
      }));
      setLogoPreview(appSettings.logo_url || '');
    } else {
      loadSettingsFromApi();
    }
  }, [appSettings]);

  const loadSettingsFromApi = async () => {
    setLoading(true);
    try {
      const res = await api.settings.getAdmin();
      if (res.success && res.settings) {
        setFormData(prev => ({
          ...prev,
          ...res.settings,
          default_entry_fee: Number(res.settings.default_entry_fee || 1000),
          default_challenge_days: Number(res.settings.default_challenge_days || 5)
        }));
        setLogoPreview(res.settings.logo_url || '');
      }
    } catch (err) {
      console.error('Failed to load application settings:', err);
      if (notify) notify(err.message || 'Failed to load app settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (field === 'logo_url') {
      setLogoPreview(value);
    }
  };

  // Handle Logo Image Upload (file reader to base64 & upload)
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (notify) notify('❌ Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      if (notify) notify('❌ Logo image must be under 8MB in size');
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;
      setLogoPreview(base64Image);
      try {
        const uploadRes = await api.settings.uploadLogo({
          image: base64Image,
          filename: file.name
        });
        if (uploadRes.success && uploadRes.url) {
          setFormData(prev => ({ ...prev, logo_url: uploadRes.url }));
          setLogoPreview(uploadRes.url);
          setHasChanges(true);
          if (notify) notify('✅ Brand Logo uploaded successfully!');
        } else {
          // Fallback to base64 directly
          setFormData(prev => ({ ...prev, logo_url: base64Image }));
          setHasChanges(true);
          if (notify) notify('✅ Brand Logo loaded');
        }
      } catch (err) {
        console.warn('Server upload failed, using local base64:', err);
        setFormData(prev => ({ ...prev, logo_url: base64Image }));
        setHasChanges(true);
        if (notify) notify('✅ Brand Logo loaded');
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: '' }));
    setLogoPreview('');
    setHasChanges(true);
    if (notify) notify('Logo image removed. Using selected brand icon.');
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.app_name || !formData.app_name.trim()) {
      if (notify) notify('❌ Application name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await api.settings.update(formData);
      if (res.success && res.settings) {
        if (notify) notify('🎉 Application settings & branding updated successfully!');
        setHasChanges(false);
        if (onUpdateSettings) {
          onUpdateSettings(res.settings);
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      if (notify) notify(`❌ ${err.message || 'Failed to save settings'}`);
    } finally {
      setSaving(false);
    }
  };

  const renderIconPreview = (iconId, size = 20, color = '#ffffff') => {
    const item = AVAILABLE_ICONS.find(i => i.id === iconId) || AVAILABLE_ICONS[0];
    const IconComp = item.icon;
    return <IconComp size={size} color={color} strokeWidth={2.5} />;
  };

  const isSuperAdmin = user?.role === 'Super Admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)'
          }}>
            <Settings size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SUPER ADMIN PLATFORM CONTROL
              </span>
              {hasChanges && (
                <span style={{ fontSize: '11px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px' }}>
                  ● Unsaved Changes
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '4px 0 0 0', color: '#ffffff' }}>
              Application Settings & Brand Control
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Customize application logo, system name, console branding, contact channels, and challenge defaults.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadSettingsFromApi}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isSuperAdmin}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              opacity: isSuperAdmin ? 1 : 0.6
            }}
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fcd34d',
          padding: '12px 18px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#92400e',
          fontSize: '13px'
        }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>View-Only Notice:</strong> Only <strong>Super Admin</strong> can save and update application branding, logo, and core settings.
          </span>
        </div>
      )}

      {/* 2. Settings Category Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '2px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'branding', label: '1. Brand Logo & App Name', icon: Image },
          { id: 'defaults', label: '2. Challenge & Logistics Defaults', icon: Sliders },
          { id: 'contact', label: '3. Support & Corporate Contact', icon: Phone },
          { id: 'security', label: '4. System Modes & Governance', icon: Shield },
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'branding' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Column A: Logo & Brand Name Inputs */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <Image size={18} color="#0284c7" />
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Brand Name & Logo Configuration
              </h3>
            </div>

            {/* App Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Application / Platform Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.app_name}
                onChange={(e) => handleChange('app_name', e.target.value)}
                placeholder="e.g. WinArena"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                This name is dynamically rendered across the public Navbar, browser title, emails, and invoices.
              </span>
            </div>

            {/* App Tagline */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Application Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.app_tagline}
                onChange={(e) => handleChange('app_tagline', e.target.value)}
                placeholder="e.g. Skill-Based Competitions & Guaranteed Apparel Rewards"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#334155'
                }}
              />
            </div>

            {/* Logo Image Upload / URL */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Brand Logo Image (PNG, JPG, SVG, WebP)
              </label>

              {/* Upload Button */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}>
                  <Upload size={14} />
                  <span>{uploadingLogo ? 'Uploading...' : '📁 Upload Logo File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              {/* URL Input */}
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="Or paste Direct Image URL (https://...)"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  color: '#334155'
                }}
              />
            </div>

            {/* Fallback Brand Icon Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Fallback Brand Icon (Used when no custom image is set)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = formData.logo_icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleChange('logo_icon', item.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComp size={16} color={isSelected ? '#ffffff' : '#475569'} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#0369a1' : '#64748b', textAlign: 'center' }}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Console Customization (From User Screenshot) */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={15} color="#0284c7" />
                <span>Admin Console Top-Left Header Branding</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
                    Header Title
                  </label>
                  <input
                    type="text"
                    value={formData.admin_header_title}
                    onChange={(e) => handleChange('admin_header_title', e.target.value)}
                    placeholder="WinArena"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
                    Header Badge
                  </label>
                  <input
                    type="text"
                    value={formData.admin_header_badge}
                    onChange={(e) => handleChange('admin_header_badge', e.target.value)}
                    placeholder="CONTROL"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
                  Header Subtitle
                </label>
                <input
                  type="text"
                  value={formData.admin_header_subtitle}
                  onChange={(e) => handleChange('admin_header_subtitle', e.target.value)}
                  placeholder="Operations & Ops Console"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Column B: Live Preview Side-by-Side Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '22px',
              border: '1.5px solid #bae6fd',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Eye size={18} color="#0284c7" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  Live Preview: Public Navbar
                </h3>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Brand Logo"
                      style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px' }}
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
                      {renderIconPreview(formData.logo_icon, 20)}
                    </div>
                  )}
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                    {formData.app_name || 'WinArena'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0284c7', background: '#f0f9ff', padding: '6px 12px', borderRadius: '6px' }}>Home</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', padding: '6px 12px' }}>All Tournaments</span>
                </div>
              </div>
            </div>

            {/* Admin Console Header Live Preview (Matches user screenshot) */}
            <div style={{
              background: '#0b1120',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Shield size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Live Preview: Admin Portal Sidebar Header
                </h3>
              </div>

              <div style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'contain', background: '#ffffff', padding: '3px' }}
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
                    {renderIconPreview(formData.logo_icon, 22)}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {formData.admin_header_title || formData.app_name || 'WinArena'}
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
                      {formData.admin_header_badge || 'CONTROL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {formData.admin_header_subtitle || 'Operations & Ops Console'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Challenge & Logistics Defaults */}
      {activeTab === 'defaults' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Sliders size={18} color="#0284c7" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Default Challenge & Logistics Parameters
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {/* Default Challenge Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Default Challenge Duration (Days)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.default_challenge_days}
                  onChange={(e) => handleChange('default_challenge_days', parseInt(e.target.value, 10) || 5)}
                  style={{ width: '120px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[3, 5, 7, 10, 15].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleChange('default_challenge_days', d)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: formData.default_challenge_days === d ? '#0284c7' : '#f8fafc',
                        color: formData.default_challenge_days === d ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Pre-selected day length when creating new tournaments in the Admin portal.
              </span>
            </div>

            {/* Default Entry Fee */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Standard Challenge Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.default_entry_fee}
                onChange={(e) => handleChange('default_entry_fee', parseFloat(e.target.value) || 1000)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Pre-populated entry fee for verified participant arcade access.
              </span>
            </div>

            {/* Default Courier Partner */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Default Express Courier Partner
              </label>
              <select
                value={formData.default_courier_partner}
                onChange={(e) => handleChange('default_courier_partner', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
              >
                <option value="BlueDart Express">BlueDart Express (Air Priority)</option>
                <option value="Delhivery Logistics">Delhivery Logistics</option>
                <option value="DTDC Express">DTDC Express Surface</option>
                <option value="India Post Speed Post">India Post Speed Post</option>
              </select>
            </div>

            {/* Currency Symbol */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Currency Symbol & Code
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.currency_symbol}
                  onChange={(e) => handleChange('currency_symbol', e.target.value)}
                  placeholder="₹"
                  style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', textAlign: 'center', fontWeight: '800' }}
                />
                <input
                  type="text"
                  value={formData.currency_code}
                  onChange={(e) => handleChange('currency_code', e.target.value)}
                  placeholder="INR"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Support & Contact Details */}
      {activeTab === 'contact' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Phone size={18} color="#0284c7" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Customer Support & Corporate Contact Channels
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Official Support Email
              </label>
              <input
                type="email"
                value={formData.support_email}
                onChange={(e) => handleChange('support_email', e.target.value)}
                placeholder="support@winarena.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Helpline Phone Number
              </label>
              <input
                type="text"
                value={formData.support_phone}
                onChange={(e) => handleChange('support_phone', e.target.value)}
                placeholder="+91 97711 22334"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                WhatsApp Direct Help Desk
              </label>
              <input
                type="text"
                value={formData.support_whatsapp}
                onChange={(e) => handleChange('support_whatsapp', e.target.value)}
                placeholder="+91 97711 22334"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Registered Corporate Office & Return Hub
              </label>
              <textarea
                rows={3}
                value={formData.office_address}
                onChange={(e) => handleChange('office_address', e.target.value)}
                placeholder="Level 4, Prestige Tech Park, Outer Ring Road, Bengaluru - 560103"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System Modes & Governance */}
      {activeTab === 'security' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Shield size={18} color="#0284c7" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              Platform Modes & Operational Policies
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Maintenance Mode Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '12px',
              border: formData.maintenance_mode ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
              background: formData.maintenance_mode ? '#fef2f2' : '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  Platform Maintenance Mode
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  When enabled, public visitors see a maintenance screen while administrators can still access console.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenance_mode}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Allow User Registrations */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  Allow New User Registrations
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Allow new players to sign up for tournament accounts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.allow_registrations}
                onChange={(e) => handleChange('allow_registrations', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Guaranteed Gift Reward Program */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  Guaranteed Apparel Reward Program
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Include 100% free guaranteed apparel selection during contest registration.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enable_guaranteed_gifts}
                onChange={(e) => handleChange('enable_guaranteed_gifts', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Footer Copyright Text */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={formData.footer_copyright_text}
                onChange={(e) => handleChange('footer_copyright_text', e.target.value)}
                placeholder="© 2026 WinArena Technologies. All rights reserved."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Sticky Action Bar (When changes exist) */}
      {hasChanges && (
        <div style={{
          position: 'sticky',
          bottom: '20px',
          background: '#0b1120',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#38bdf8" />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>
              You have unsaved changes in Application Settings.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={loadSettingsFromApi}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isSuperAdmin}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
              }}
            >
              {saving ? 'Saving Changes...' : 'Save & Apply Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
