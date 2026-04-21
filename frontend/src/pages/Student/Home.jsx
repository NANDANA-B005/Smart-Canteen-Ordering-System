import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const [budget, setBudget] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.filter(p => p.quantity > 0 && p.status !== 'Sold Out')))
      .catch(err => console.error(err));
  }, []);

  const getRecommendation = (e) => {
    e.preventDefault();
    const budgetVal = Number(budget);
    if (!budgetVal || budgetVal <= 0) return;
    
    const affordable = products.filter(p => p.price <= budgetVal).sort((a, b) => b.price - a.price);
    
    if (affordable.length === 0) {
      setSuggestion({ text: "Sorry, nothing fits this budget right now.", items: [] });
      return;
    }
    
    const topPick = affordable[0];
    const leftOver = budgetVal - topPick.price;
    const nextPick = affordable.find(p => p.price <= leftOver && p._id !== topPick._id);
    
    let items = [topPick];
    if (nextPick) items.push(nextPick);

    setSuggestion({
      text: `We suggest this combo for ₹${items.reduce((sum, i) => sum + i.price, 0)}:`,
      items: items
    });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1 className="heading" style={{ fontSize: '3.5rem' }}>Next-Gen Canteen Ordering</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        Skip the queue. Order from multiple counters. Pay manually with UPI. One single QR for pickup.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem' }}>
        <Link to="/menu" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Browse Menu <Utensils size={20} />
        </Link>
        <Link to="/staff/login" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
          Staff Portal
        </Link>
      </div>

      <div className="grid-cards" style={{ textAlign: 'left', alignItems: 'stretch' }}>
        <div className="glass-panel" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 300px' }}>
              <Zap size={32} color="var(--warning)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Smart Recommendation</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Not sure what to eat? Enter your budget below and let us find the best combo from currently available stock.
              </p>
              <form onSubmit={getRecommendation} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  placeholder="Enter Budget (e.g. 100)" 
                  value={budget} 
                  onChange={e => setBudget(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn">Ask <ArrowRight size={18} /></button>
              </form>
            </div>
            
            {suggestion && (
              <div style={{ flex: '1 1 300px', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.2rem' }}>Suggestion</h4>
                <p style={{ marginBottom: '1rem' }}>{suggestion.text}</p>
                {suggestion.items.map((item, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', margin: '0.5rem 0' }}>
                     <span>{item.name}</span>
                     <span style={{ fontWeight: 'bold' }}>₹{item.price}</span>
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel">
          <Utensils size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3>Multi-Counter Setup</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Add Chai from Tea counter and Biryani from Meals to the same cart. Your order is seamlessly split for staff.
          </p>
        </div>
        <div className="glass-panel">
          <ShieldCheck size={32} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
          <h3>Manual UPI & One QR</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Pay verified manually via UPI. Receive a single robust QR to scan at all required counters for pickup.
          </p>
        </div>
      </div>
    </div>
  );
}
