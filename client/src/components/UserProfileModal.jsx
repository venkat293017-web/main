import React, { useState, useRef, useEffect } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Building, Truck, 
  Camera, Check, AlertCircle, Shield, Trash2, Upload, 
  Navigation, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';


const INDIAN_STATES = [
  'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana',
  'Maharashtra', 'Delhi', 'Gujarat', 'West Bengal', 'Rajasthan',
  'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Odisha',
  'Bihar', 'Goa', 'Assam', 'Jharkhand', 'Chhattisgarh'
];

export default function UserProfileModal({ user, onClose, onProfileUpdated, initialTab = 'profile' }) {
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(initialTab || 'profile');

  // Personal state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Delivery Address state
  const [address, setAddress] = useState(user?.address || '');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [city, setCity] = useState(user?.city || 'Chennai');
  const [state, setState] = useState(user?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(user?.pincode || '');

  // Sync state whenever user or initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
      setAddress(user.address || '');
      setLandmark(user.landmark || '');
      setCity(user.city || 'Chennai');
      setState(user.state || 'Tamil Nadu');
      setPincode(user.pincode || '');
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Photo File Upload with Canvas compression
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // Crisp avatar size
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(dataUrl);
          setError('');
          setSuccessMsg('Photo selected! Click "Save Changes" to save to your profile.');
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          console.error(err);
          setAvatarUrl(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };


  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) {
      setError('Full Name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl || null,
        address: address.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };

      const res = await api.auth.updateProfile(payload);

      if (res.success) {
        setSuccessMsg('✅ Profile & Delivery Address saved successfully!');
        if (onProfileUpdated) {
          onProfileUpdated(res.user);
        }
        setTimeout(() => {
          setSuccessMsg('');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="profile-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="profile-modal-card">
        {/* Modal Top Header */}
        <div className="profile-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              className="mobile-back-btn"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h2 className="profile-modal-title">
                Profile & Delivery Address
              </h2>
            </div>
          </div>

          {/* Top Actions: Quick Save & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="top-save-btn"
              title="Save Changes"
            >
              <Check size={15} strokeWidth={2.5} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              onClick={onClose}
              className="top-close-btn"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher - 50% / 50% Equal on Mobile */}
        <div className="profile-modal-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User size={16} />
            <span>Profile & Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`profile-tab-btn ${activeTab === 'address' ? 'active' : ''}`}
          >
            <Truck size={16} />
            <span>Delivery Address</span>
            {(!address || !pincode) && (
              <span className="dot-indicator" />
            )}
          </button>
        </div>

        {/* Form Container wrapping scrollable body and pinned footer */}
        <form onSubmit={handleSubmit} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Modal Scrollable Body */}
          <div className="profile-modal-body">
            {error && (
              <div className="alert-box error">
                <AlertCircle size={18} flexShrink={0} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-box success">
                <CheckCircle2 size={18} flexShrink={0} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: Profile & Photo */}
            {activeTab === 'profile' && (
              <div>
                {/* Compact Photo Upload Section */}
                <div className="avatar-upload-card">
                  {/* Avatar Preview */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="avatar-circle">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        name ? name.substring(0, 2).toUpperCase() : 'US'
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Custom Photo"
                      className="camera-upload-btn"
                    >
                      <Camera size={13} />
                    </button>
                  </div>

                  {/* Upload Actions & Help */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                      Profile Photo
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                      Upload your personal face photo (JPG, PNG, WebP).
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-upload"
                      >
                        <Upload size={13} />
                        <span>Upload Photo</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="btn-remove"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Inputs */}
                <div className="form-inputs-stack">
                  <div>
                    <label className="field-label">
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        required
                        className="field-input with-icon"
                      />
                      <User size={16} color="#64748b" className="field-icon" />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        disabled
                        className="field-input with-icon disabled"
                      />
                      <Mail size={16} color="#94a3b8" className="field-icon" />
                    </div>
                    <span className="field-hint">
                      Verified login email cannot be changed.
                    </span>
                  </div>

                  <div>
                    <label className="field-label">
                      Mobile / WhatsApp Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="field-input with-icon"
                      />
                      <Phone size={16} color="#64748b" className="field-icon" />
                    </div>
                    <span className="field-hint">
                      Used for BlueDart courier delivery SMS & verification calls.
                    </span>
                  </div>

                  <div>
                    <label className="field-label">
                      Account Role
                    </label>
                    <div className="role-badge-card">
                      <Shield size={16} color="#0284c7" />
                      <span>{user?.role || 'Users'}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                        Active Contestant
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Delivery Address (Gifts & Prizes) */}
            {activeTab === 'address' && (
              <div>
                {/* Address Form Inputs */}
                <div className="form-inputs-stack">
                  <div>
                    <label className="field-label">
                      Flat / House No., Building Name & Street Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Flat 302, Green Valley Apartments, 4th Main Road, Anna Nagar"
                        className="field-textarea"
                      />
                      <MapPin size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div>
                      <label className="field-label">
                        Landmark (Optional)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Apollo Pharmacy"
                          className="field-input with-icon"
                        />
                        <Navigation size={16} color="#64748b" className="field-icon" />
                      </div>
                    </div>

                    <div>
                      <label className="field-label">
                        City / Town <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Chennai, Coimbatore, Madurai"
                          className="field-input with-icon"
                        />
                        <Building size={16} color="#64748b" className="field-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="form-row-2col">
                    <div>
                      <label className="field-label">
                        State <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="field-select"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">
                        Postal Pincode (6 Digits) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 600020"
                        className="field-input pincode"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Bottom Pinned Footer - Guaranteed 100% Visible on All Screens */}
          <div className="profile-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-save-main"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        /* Desktop Defaults */
        .profile-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background-color: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .profile-modal-card {
          width: 100%;
          maxWidth: 640px;
          max-height: 90vh;
          height: auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          animation: fadeIn 0.2s ease-out;
        }

        .profile-modal-header {
          background: linear-gradient(135deg, #0b1120 0%, #0369a1 100%);
          color: #ffffff;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .mobile-back-btn {
          display: none;
          background: transparent;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 4px;
        }

        .profile-modal-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .top-save-btn {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }

        .top-close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        }

        .profile-modal-tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .profile-tab-btn {
          flex: 1;
          padding: 14px 16px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .profile-tab-btn.active {
          color: #0284c7;
          border-bottom: 3px solid #0284c7;
        }

        .dot-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f59e0b;
        }

        .profile-modal-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 20px 24px;
        }

        .alert-box {
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .alert-box.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .alert-box.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        .avatar-upload-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
          border: 2.5px solid #ffffff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 20px;
          font-weight: 800;
        }

        .camera-upload-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #0284c7;
          color: #ffffff;
          border: 2px solid #ffffff;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .btn-upload {
          background: #ffffff;
          border: 1.5px solid #0284c7;
          color: #0284c7;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .btn-remove {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }

        .form-inputs-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          display: block;
          margin-bottom: 6px;
        }

        .field-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
        }

        .field-input.with-icon {
          padding-left: 38px;
        }

        .field-input.disabled {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }

        .field-input.pincode {
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .field-input:focus, .field-textarea:focus, .field-select:focus {
          border-color: #0284c7 !important;
        }

        .field-textarea {
          width: 100%;
          padding: 10px 12px 10px 38px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          outline: none;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
        }

        .field-select {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          outline: none;
          background: #ffffff;
          cursor: pointer;
          box-sizing: border-box;
        }

        .field-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
        }

        .field-hint {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
          display: block;
        }

        .role-badge-card {
          padding: 11px 14px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .profile-modal-footer {
          padding: 12px 24px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
          z-index: 10;
        }

        .btn-cancel {
          padding: 11px 18px;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: '#475569';
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
        }

        .btn-save-main {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
          white-space: nowrap;
        }

        /* 📱 100% NATIVE MOBILE RESPONSIVE VIEW (Screens <= 768px) */
        @media (max-width: 768px) {
          .profile-modal-backdrop {
            padding: 0 !important;
            align-items: stretch !important;
            justify-content: stretch !important;
            background: #ffffff !important;
          }

          .profile-modal-card {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          .mobile-back-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }

          .profile-modal-header {
            padding: 12px 14px !important;
          }

          .profile-modal-title {
            font-size: 17px !important;
          }

          .profile-tab-btn {
            padding: 12px 10px !important;
            font-size: 13px !important;
          }

          .profile-modal-body {
            padding: 14px 16px !important;
          }

          /* Force all 2-col inputs to stack in single column on mobile */
          .form-row-2col {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .avatar-upload-card {
            padding: 10px 12px !important;
            gap: 12px !important;
            margin-bottom: 14px !important;
          }

          .profile-modal-footer {
            padding: 12px 16px !important;
            padding-bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.1) !important;
          }

          .btn-save-main {
            font-size: 15px !important;
            padding: 13px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
