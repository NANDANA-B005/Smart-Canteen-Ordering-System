import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';

export default function Checkout() {
  const { cart, total } = useContext(CartContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: '',
    studentRoll: '',
    mobile: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Cart is empty!');
    // Save info temporarily to pass to the manual Payment phase
    localStorage.setItem('checkout_data', JSON.stringify({ ...formData, total }));
    navigate('/payment');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="heading">Checkout Details</h1>
      
      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Full Name *</label>
            <input 
              type="text" 
              required 
              value={formData.studentName} 
              onChange={e => setFormData({...formData, studentName: e.target.value})} 
              placeholder="e.g. John Doe" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Roll Number / Student ID</label>
            <input 
              type="text" 
              value={formData.studentRoll} 
              onChange={e => setFormData({...formData, studentRoll: e.target.value})} 
              placeholder="Optional" 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mobile Number</label>
            <input 
              type="tel" 
              value={formData.mobile} 
              onChange={e => setFormData({...formData, mobile: e.target.value})} 
              placeholder="Optional" 
            />
          </div>
          
          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>Total to Pay</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{total}</span>
          </div>

          <button type="submit" className="btn" style={{ width: '100%', padding: '1rem' }}>
            Continue to Payment
          </button>
        </form>
      </div>
    </div>
  );
}
