import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { QrReader } from 'react-qr-reader';
import { Camera, LogOut, Check, Search, Trash2 } from 'lucide-react';

export default function StaffDashboard() {
  const counter = localStorage.getItem('staff_counter');
  const token = localStorage.getItem('staff_token');
  const navigate = useNavigate();
  const socket = useContext(SocketContext);

  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState('dashboard'); // 'dashboard' or 'scanner'
  const [scannedOrder, setScannedOrder] = useState(null);
  const [manualOrderId, setManualOrderId] = useState('');
  const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '', image: '', tags: '', itemCounter: counter === 'All-Admin' ? 'Tea' : counter });

  useEffect(() => {
    if (!token) navigate('/staff/login');

    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        // Filter products only for this staff's counter
        if (counter !== 'All-Admin') {
            setProducts(data.filter(p => p.counter === counter));
        } else {
            setProducts(data);
        }
      });

    if (socket) {
      socket.on('product_updated', (updatedProduct) => {
        if (updatedProduct.counter === counter || counter === 'All-Admin') {
            setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        }
      });
      socket.on('product_deleted', (deletedProductId) => {
        setProducts(prev => prev.filter(p => p._id !== deletedProductId));
      });
      // Further real-time feature: listen for new_order to show a bell or count (Optional enhancement)
    }

    return () => {
      if (socket) {
          socket.off('product_updated');
          socket.off('product_deleted');
      }
    };
  }, [counter, token, navigate, socket]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/staff/login');
  };

  const handleUpdateStock = async (productId, currentQty, amount) => {
    const newQty = Math.max(0, currentQty + amount);
    try {
      await fetch(`http://localhost:5000/api/products/${productId}/stock`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify({ quantity: newQty })
      });
    } catch (err) { console.error('Error updating stock', err); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.quantity) return alert('Please fill required fields');
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newItem.name,
          price: Number(newItem.price),
          quantity: Number(newItem.quantity),
          counter: counter === 'All-Admin' ? newItem.itemCounter : counter,
          imageUrl: newItem.image,
          tags: newItem.tags ? newItem.tags.split(',').map(t => t.trim().toLowerCase()) : []
        })
      });
      if (res.ok) {
        setNewItem({ ...newItem, name: '', price: '', quantity: '', image: '', tags: '' });
      } else {
        alert('Failed to add item');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?\nThis action cannot be undone.")) return;
    try {
        const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const data = await res.json();
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        console.error('Failed to delete item', err);
    }
  };

  // QR Scanning Logic
  const handleScanResult = async (result, error) => {
    if (!!result) {
        lookupOrder(result?.text);
    }
  };

  const lookupOrder = async (orderIdToFetch) => {
      try {
          const res = await fetch(`http://localhost:5000/api/orders/${orderIdToFetch}`);
          if (res.ok) {
              const orderData = await res.json();
              // Filter out items that do NOT belong to this counter
              if (counter !== 'All-Admin') {
                  orderData.items = orderData.items.filter(i => i.counter === counter);
              }
              setScannedOrder(orderData);
          } else {
              alert('Order not found!');
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleServeItem = async (orderId, itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/items/${itemId}/serve`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          // Re-fetch or update local state
          lookupOrder(orderId);
      } else {
          const data = await res.json();
          alert(data.error);
      }
    } catch (err) {
        console.error('Failed to serve item');
    }
  };


  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading" style={{ margin: 0 }}>{counter} Station</h1>
          <p style={{ color: 'var(--text-muted)' }}>Staff Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn ${mode === 'scanner' ? 'btn-secondary' : ''}`} onClick={() => { setMode('scanner'); setScannedOrder(null); }}>
            <Camera size={18} /> Scanner
          </button>
          <button className={`btn ${mode === 'dashboard' ? 'btn-secondary' : ''}`} onClick={() => setMode('dashboard')}>
            Menu Manage
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {mode === 'dashboard' && (
        <>
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Item</h3>
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Name</label>
                <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Item Name" required />
              </div>
              <div style={{ flex: '1 1 100px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price (₹)</label>
                <input type="number" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="Price" required />
              </div>
              <div style={{ flex: '1 1 100px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Initial Qty</label>
                <input type="number" min="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} placeholder="Quantity" required />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tags (comma separated)</label>
                <input type="text" value={newItem.tags} onChange={e => setNewItem({...newItem, tags: e.target.value})} placeholder="e.g. snack, spicy" />
              </div>
              {counter === 'All-Admin' && (
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Counter</label>
                  <select value={newItem.itemCounter} onChange={e => setNewItem({...newItem, itemCounter: e.target.value})}>
                    <option value="Tea">Tea</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Meals">Meals</option>
                  </select>
                </div>
              )}
              <div style={{ flex: '2 1 200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Image URL (Optional)</label>
                <input type="text" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="https://example.com/image.png" />
              </div>
              <button type="submit" className="btn" style={{ height: '45px' }}>Add Menu Item</button>
            </form>
          </div>
          <div className="grid-cards">
          {products.map(p => (
            <div key={p._id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{p.name}</h3>
                    <button 
                        onClick={() => handleDeleteItem(p._id)}
                        className="btn"
                        style={{ padding: '0.25rem', background: 'transparent', color: 'var(--danger)', marginTop: '-5px', border: '1px solid rgba(239,68,68,0.3)' }}
                        title="Delete Item"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleUpdateStock(p._id, p.quantity, -1)}>-</button>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{p.quantity}</span><br />
                        <small style={{ color: 'var(--text-muted)' }}>In Stock</small>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleUpdateStock(p._id, p.quantity, +1)}>+</button>
                </div>
            </div>
          ))}
          </div>
        </>
      )}

      {mode === 'scanner' && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ flex: '1 1 300px' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera /> Scan Student QR</h3>
                
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)', marginBottom: '1rem' }}>
                    <QrReader
                        onResult={handleScanResult}
                        constraints={{ facingMode: 'environment' }}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ margin: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>— OR MUANUAL FALLBACK —</div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="text" 
                        placeholder="Enter Order ID (e.g. ORD-1234)" 
                        value={manualOrderId} 
                        onChange={e => setManualOrderId(e.target.value)} 
                    />
                    <button className="btn" onClick={() => lookupOrder(manualOrderId)}><Search size={18} /></button>
                </div>
            </div>

            {scannedOrder && (
                <div className="glass-panel" style={{ flex: '2 1 400px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Order: {scannedOrder.orderId}</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Student: {scannedOrder.studentName}</p>

                    {scannedOrder.items.length === 0 ? (
                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '8px' }}>
                            This order contains no items for the {counter} counter. Please review the physical receipt or ask the student.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Item</th>
                                    <th style={{ padding: '0.5rem' }}>Qty</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                    <th style={{ padding: '0.5rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scannedOrder.items.map(item => (
                                    <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem 0.5rem' }}>{item.name}</td>
                                        <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{item.quantity}</td>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            <span className={`badge ${item.serveStatus === 'Completed' ? 'badge-available' : 'badge-lowstock'}`}>
                                                {item.serveStatus}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 0.5rem' }}>
                                            {item.serveStatus === 'Pending' ? (
                                                <button className="btn" style={{ padding: '0.5rem 1rem' }} onClick={() => handleServeItem(scannedOrder.orderId, item._id)}>
                                                    Serve <Check size={16} />
                                                </button>
                                            ) : (
                                                <span style={{ color: 'var(--secondary)' }}><Check size={24} /></span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
}
