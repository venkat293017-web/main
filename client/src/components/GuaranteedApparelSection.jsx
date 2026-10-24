import React from 'react';
import { Gift, Sparkles, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';

export default function GuaranteedApparelSection({ gifts = [], onSelectGiftForChallenge }) {
  const activeGifts = gifts.filter((g) => g.is_active !== false);

  return (
    <section style={{ padding: '3.5rem 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
      <div className="container">
        {/* Header matching Screenshot 1 */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.8px',
            color: '#0284c7',
            background: '#e0f2fe',
            padding: '4px 14px',
            borderRadius: '9999px',
            marginBottom: '10px',
            textTransform: 'uppercase'
          }}>
            <Gift size={13} />
            <span>INCLUDED FREE WITH EVERY ENTRY</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.02em',
            marginBottom: '10px'
          }}>
            Guaranteed Apparel Collection
          </h2>

          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
            Nobody leaves empty-handed. Pick 1 of these high-quality garments delivered directly to your doorstep.
          </p>
        </div>

        {/* Apparel Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {activeGifts.map((gift) => (
            <div
              key={gift.id}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.04)';
              }}
            >
              {/* Image Frame */}
              <div style={{
                width: '100%',
                height: '240px',
                borderRadius: '14px',
                overflow: 'hidden',
                background: '#f1f5f9',
                marginBottom: '16px',
                position: 'relative'
              }}>
                <img
                  src={gift.image_url}
                  alt={gift.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>

              {/* Category Pill Tag */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#0284c7',
                  background: '#e0f2fe',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {gift.category}
                </span>
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '8px',
                lineHeight: 1.3
              }}>
                {gift.name}
              </h3>

              {/* Tagline / Fabric specs */}
              <p style={{
                fontSize: '12px',
                color: '#64748b',
                lineHeight: 1.5,
                marginBottom: '20px',
                flex: 1
              }}>
                {gift.tagline || gift.description}
              </p>

              {/* Value & Included Free Pill */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                  Value: <span style={{ color: '#0f172a', fontWeight: '700' }}>₹{Number(gift.market_value).toLocaleString('en-IN')}</span>
                </div>

                <div style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  letterSpacing: '0.4px'
                }}>
                  INCLUDED FREE
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
