import React, { useState, useEffect } from 'react';
import { 
  X, PackageCheck, Truck, CheckCircle2, Clock, MapPin, 
  Printer, ArrowRight, ShieldCheck, ExternalLink, QrCode
} from 'lucide-react';
import { api } from '../services/api';

export default function MyOrdersModal({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.orders.getMy();
        if (res.success) {
          setOrders(res.orders || []);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return '#059669';
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
        return '#0284c7';
      case 'PACKED':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ORDER_PLACED':
        return 'Order Placed & Confirmed';
      case 'PACKED':
        return 'Packed & QC Passed';
      case 'DISPATCHED':
        return 'Dispatched with Courier';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Successfully Delivered';
      default:
        return status;
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
        maxWidth: '680px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PackageCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Guaranteed Apparel Deliveries
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Step 6: Official Logistics Fulfillment & Doorstep Courier Tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              Loading your verified orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <PackageCheck size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                No Orders Placed Yet
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Join any 5-day tournament for ₹1,000 to choose and receive your guaranteed apparel delivery!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map((order) => {
                const timeline = order.tracking_timeline || [];

                return (
                  <div
                    key={order.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '18px',
                      padding: '20px',
                      background: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Top Row: Order Number & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Official Logistics Order:</span>{' '}
                        <strong style={{ fontSize: '14px', color: '#0284c7', fontFamily: 'monospace' }}>
                          {order.order_number}
                        </strong>
                      </div>
                      <div style={{
                        background: `${getStatusColor(order.fulfillment_status)}15`,
                        color: getStatusColor(order.fulfillment_status),
                        border: `1px solid ${getStatusColor(order.fulfillment_status)}40`,
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase'
                      }}>
                        {getStatusText(order.fulfillment_status)}
                      </div>
                    </div>

                    {/* Apparel Item Recap */}
                    <div style={{
                      display: 'flex',
                      gap: '14px',
                      background: '#f8fafc',
                      borderRadius: '14px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        flexShrink: 0
                      }}>
                        <img
                          src={order.gift_image}
                          alt={order.gift_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase' }}>
                          Guaranteed {order.gift_category}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                          {order.gift_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          Size: <strong>{order.selected_size}</strong> {order.selected_color ? `• Color: ${order.selected_color}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                          100% INCLUDED
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Tournament Entry Fee: ₹{Number(order.amount_paid).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Delivery & Courier Partner Info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      fontSize: '12px',
                      marginBottom: '16px',
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div>
                        <div style={{ color: '#0369a1', fontWeight: '700' }}>Courier Partner:</div>
                        <div style={{ color: '#0f172a', fontWeight: '800' }}>{order.courier_partner}</div>
                        <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                          AWB: {order.tracking_number}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#0369a1', fontWeight: '700' }}>Shipping Destination:</div>
                        <div style={{ color: '#0f172a', fontWeight: '700' }}>{order.shipping_name}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                          {order.shipping_address}, {order.shipping_city} - {order.shipping_pincode}
                        </div>
                      </div>
                    </div>

                    {/* Tracking Timeline Stepper */}
                    {timeline.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                          Logistics Tracking History:
                        </div>
                        <div style={{ borderLeft: '2px solid #0284c7', paddingLeft: '14px', marginLeft: '6px' }}>
                          {timeline.map((step, idx) => (
                            <div key={idx} style={{ position: 'relative', marginBottom: '10px' }}>
                              <div style={{
                                position: 'absolute',
                                left: '-20px',
                                top: '2px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#0284c7',
                                border: '2px solid #ffffff'
                              }} />
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                {step.status}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {step.note} • {new Date(step.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Printer size={14} />
                        <span>Print Official Packing Slip / Invoice</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice Modal Popup if clicked */}
        {selectedInvoiceOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              color: '#0f172a',
              fontFamily: 'monospace'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900' }}>WINARENA LOGISTICS INVOICE</h2>
                  <div style={{ fontSize: '11px' }}>Official Dispatch Order & Guarantee Receipt</div>
                </div>
                <button onClick={() => setSelectedInvoiceOrder(null)} style={{ background: 'transparent' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ fontSize: '12px', lineHeight: 1.6, marginBottom: '14px' }}>
                <div><strong>ORDER NO:</strong> {selectedInvoiceOrder.order_number}</div>
                <div><strong>AWB COURIER:</strong> {selectedInvoiceOrder.courier_partner} ({selectedInvoiceOrder.tracking_number})</div>
                <div><strong>DATE:</strong> {new Date(selectedInvoiceOrder.created_at).toLocaleDateString()}</div>
                <div><strong>RECIPIENT:</strong> {selectedInvoiceOrder.shipping_name}</div>
                <div><strong>DELIVERY ADDRESS:</strong> {selectedInvoiceOrder.shipping_address}, {selectedInvoiceOrder.shipping_city} - {selectedInvoiceOrder.shipping_pincode}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', margin: '14px 0', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ITEM: Guaranteed {selectedInvoiceOrder.gift_name}</span>
                  <span>Qty: 1</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                  <span>SPEC: Size {selectedInvoiceOrder.selected_size}</span>
                  <span>INCLUDED FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontWeight: '700' }}>
                  <span>TOTAL TOURNAMENT PARTICIPATION PAID:</span>
                  <span>₹{Number(selectedInvoiceOrder.amount_paid).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <QrCode size={64} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '10px', color: '#666' }}>
                  VERIFIED AUTHENTIC PACKING SLIP • PAN-INDIA DOORSTEP EXPRESS
                </div>
              </div>

              <button
                onClick={() => window.print()}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
