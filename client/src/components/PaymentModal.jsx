import React, { useState } from 'react';
import { 
  X, CheckCircle2, ShieldCheck, QrCode, ArrowRight, Loader2, 
  Smartphone, Lock, Gift, Truck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function PaymentModal({
  checkoutData,
  onClose,
  onSuccess
}) {
  const [selectedMethod, setSelectedMethod] = useState('GPay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');

  const upiMethods = [
    { id: 'GPay', name: 'Google Pay', icon: '⚡' },
    { id: 'PhonePe', name: 'PhonePe', icon: '🟣' },
    { id: 'Paytm', name: 'Paytm UPI', icon: '🔷' },
    { id: 'QR', name: 'Scan & Pay QR', icon: '📱' },
  ];

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate UPI processing delay
      await new Promise((r) => setTimeout(r, 1200));

      const payload = {
        ...checkoutData,
        payment_method: `UPI (${selectedMethod})`,
        payment_txn_id: `UPI-TXN-${Date.now()}`
      };

      const res = await api.orders.checkout(payload);

      if (res.success) {
        setPaymentSuccess(true);
        setOrderResult(res.order);

        // Fire celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore if confetti fails
        }

        if (onSuccess) {
          onSuccess(res.order, res.entry);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '12px'
            }}>
              ₹
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              Secure UPI Payment Gateway
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {paymentSuccess ? (
          /* Step 4: Success State matching requirements */
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 0 8px #d1fae5'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Payment Verified! Entry Confirmed
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Your official logistics order has been recorded and retro Snake II skill arena is unlocked!
            </p>

            {/* Generated Official Logistics Order Details */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              textAlign: 'left',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Logistics Order No:</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '14px' }}>
                  {orderResult?.order_number}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Guaranteed Gift:</span>
                <strong style={{ color: '#0f172a' }}>
                  {checkoutData.gift_name} ({checkoutData.selected_size})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Courier Tracking AWB:</span>
                <strong style={{ color: '#059669', fontFamily: 'monospace' }}>
                  {orderResult?.tracking_number}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Paid:</span>
                <strong style={{ color: '#0f172a' }}>₹1,000 via UPI</strong>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                padding: '14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>🎮 Launch Nokia Snake II Arcade Arena</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Step 4: Verification Form */
          <div style={{ padding: '24px' }}>
            {/* Order Summary Strip */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#e0f2fe',
                flexShrink: 0
              }}>
                <img
                  src={checkoutData.gift_image}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase' }}>
                  Tournament Entry + Guaranteed Gift
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {checkoutData.gift_name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Size: {checkoutData.selected_size} • Delivery to {checkoutData.shipping_city}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                  ₹{Number(checkoutData.entry_fee).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Select UPI Mode */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Select Instant UPI App:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {upiMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    style={{
                      border: selectedMethod === m.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: selectedMethod === m.id ? '#f0f9ff' : '#ffffff',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: selectedMethod === m.id ? '700' : '500',
                      color: selectedMethod === m.id ? '#0284c7' : '#334155',
                      textAlign: 'left'
                    }}
                  >
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code / Virtual UPI ID Display */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                margin: '0 auto 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <QrCode size={96} color="#0f172a" />
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                UPI ID: <span style={{ color: '#0284c7' }}>winarena.tournaments@icici</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Scan with any UPI app or click Verify below to complete simulation
              </div>
            </div>

            {error && (
              <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '12px', fontWeight: '600', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                padding: '14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Verifying ₹1,000 UPI Payment...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Verify ₹1,000 Payment & Place Order</span>
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>256-Bit Encrypted UPI Verification. 100% Guaranteed Apparel Courier Dispatch.</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
