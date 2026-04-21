import { useContext } from 'react';
import { CartContext } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, total } = useContext(CartContext);
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 className="heading">Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
        <Link to="/menu" className="btn">Browse Menu</Link>
      </div>
    );
  }

  // Group by counters visually
  const countersInCart = [...new Set(cart.map(i => i.counter))];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="heading">Smart Cart</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Items from multiple counters ({countersInCart.join(', ')}) will be split automatically for staff.
      </p>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {cart.map(item => (
          <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{item.counter} Counter</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none' }} onClick={() => updateQuantity(item._id, -1)}>-</button>
                <span style={{ padding: '0 1rem', fontWeight: 'bold' }}>{item.quantity}</span>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none' }} onClick={() => updateQuantity(item._id, 1)}>+</button>
              </div>
              
              <div style={{ width: '80px', textAlign: 'right', fontWeight: 'bold' }}>
                ₹{item.price * item.quantity}
              </div>

              <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--danger)' }} onClick={() => removeFromCart(item._id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Total Amount</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{total}</span>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => navigate('/checkout')} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          Proceed to Checkout <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
