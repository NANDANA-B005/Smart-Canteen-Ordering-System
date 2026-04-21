import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { QrCode, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Payment() {
  const { cart, total, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('checkout_data');
    if (!data || cart.length === 0) {
      navigate('/cart');
    } else {
      setCheckoutData(JSON.parse(data));
    }
  }, [cart, navigate]);

  const handleManualConfirm = async () => {
    setLoading(true);
    try {
      // 1. Prepare Order Payload
      const orderPayload = {
        studentName: checkoutData.studentName,
        studentRoll: checkoutData.studentRoll,
        mobile: checkoutData.mobile,
        totalAmount: total,
        paymentStatus: 'User Confirmed',
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          counter: item.counter,
          price: item.price,
          quantity: item.quantity,
          serveStatus: 'Pending' // Initial state
        }))
      };

      // 2. Submit to Backend
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await response.json();

      if (response.ok && data.orderId) {
        // 3. Clear cart and redirect to confirmation
        clearCart();
        localStorage.removeItem('checkout_data');
        navigate('/confirmation', { state: { orderId: data.orderId } });
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData) return null;

  // Generate UPI URI
  const upiId = 'canteen@testupi';
  const payeeName = 'Campus Canteen';
  const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${total}&cu=INR`;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="heading">Manual UPI Payment</h1>
      
      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Total Amount to Pay</p>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '2rem' }}>
          ₹{total}
        </div>

        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Scan using any UPI App</p>
          <div style={{ width: '200px', height: '200px', background: 'white', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
            <QrCode size={180} color="black" />
            {/* Note: In a real app we'd use <QRCodeCanvas value={upiLink} /> but qrcode.react handles this. Fallback to icon for now for purely visual demonstration if library fails */}
          </div>
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>UPI ID: {upiId}</p>
          
          <a href={upiLink} className="btn" style={{ width: '100%', marginTop: '1rem', background: '#3b82f6' }}>
            Open UPI App on Phone
          </a>
        </div>

        <div style={{ padding: '1rem', borderLeft: '4px solid var(--warning)', background: 'rgba(245, 158, 11, 0.1)', textAlign: 'left', marginBottom: '2rem', borderRadius: '0 8px 8px 0' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} /> Prototype Notice
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Payment is manually confirmed by the user. This prototype does not include live payment gateway verification. Please click the button below ONLY after you have successfully transferred the amount.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/checkout')}>Cancel</button>
          
          <button className="btn" style={{ flex: 2, background: 'var(--secondary)' }} onClick={handleManualConfirm} disabled={loading}>
            {loading ? 'Processing...' : <><CheckCircle size={20} /> I Have Paid</>}
          </button>
        </div>
      </div>
    </div>
  );
}
