import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2 } from 'lucide-react';

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // orderId passed from Payment via React Router state
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    fetch(`http://localhost:5000/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId, navigate]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="spinner"></div></div>;
  if (!order) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Order details not found.</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <CheckCircle2 size={64} color="var(--secondary)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
      <h1 className="heading" style={{ fontSize: '2.5rem' }}>Order Confirmed!</h1>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Show this QR code at the relevant counters to collect your order.
      </p>

      <div className="glass-panel" style={{ background: 'white', color: 'black', padding: '2rem', display: 'inline-block', marginBottom: '2rem' }}>
        <QRCodeSVG value={order.orderId} size={250} level="H" />
        <h2 style={{ marginTop: '1.5rem', fontWeight: 'bold', fontSize: '1.5rem' }}>{order.orderId}</h2>
      </div>

      <div className="glass-panel" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Order Summary</h3>
        <p><strong>Name:</strong> {order.studentName}</p>
        <p><strong>Status:</strong> <span className="badge badge-available">User Confirmed</span></p>
        
        <div style={{ marginTop: '1.5rem' }}>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <span>{item.quantity}x {item.name} <br/><small style={{ color: 'var(--text-muted)' }}>{item.counter} Counter</small></span>
              <span className="badge">{item.serveStatus}</span>
            </div>
          ))}
        </div>
      </div>

      <Link to="/" className="btn btn-secondary" style={{ width: '100%' }}>Back to Home</Link>
    </div>
  );
}
