import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { CartContext } from '../../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useContext(SocketContext);
  const { addToCart, cart } = useContext(CartContext);

  useEffect(() => {
    // Initial fetch
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error('Error fetching products', err); setLoading(false); });

    if (socket) {
      socket.on('product_updated', (updatedProduct) => {
        setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
      });
      socket.on('product_deleted', (deletedProductId) => {
        setProducts(prev => prev.filter(p => p._id !== deletedProductId));
      });
    }

    return () => { 
      if (socket) {
        socket.off('product_updated'); 
        socket.off('product_deleted');
      }
    };
  }, [socket]);

  // Group by counter
  const grouped = products.reduce((acc, p) => {
    (acc[p.counter] = acc[p.counter] || []).push(p);
    return acc;
  }, {});

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="spinner"></div></div>;

  return (
    <div>
      <h1 className="heading">Canteen Menu</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Live stock updates enabled</p>

      {Object.entries(grouped).map(([counter, items]) => (
        <div key={counter} style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#A855F7', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            {counter} Counter
          </h2>
          <div className="grid-cards">
            {items.map(item => {
              const inCart = cart.find(c => c._id === item._id);
              const availableQty = item.quantity;
              const isSoldOut = item.status === 'Sold Out' || availableQty === 0;

              return (
                <div key={item._id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary)' }}>₹{item.price}</span>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                    {isSoldOut ? (
                      <span className="badge badge-soldout">Sold Out</span>
                    ) : availableQty <= 10 ? (
                      <span className="badge badge-lowstock">Only {availableQty} left</span>
                    ) : (
                      <span className="badge badge-available">Available</span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      className="btn" 
                      style={{ width: '100%' }}
                      disabled={isSoldOut || (inCart && inCart.quantity >= availableQty)}
                      onClick={() => addToCart(item)}
                    >
                      <ShoppingCart size={18} /> {inCart ? `Add More (${inCart.quantity} in cart)` : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
