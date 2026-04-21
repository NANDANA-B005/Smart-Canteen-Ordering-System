import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { ShoppingCart, LogIn, Utensils, Sparkles } from 'lucide-react';

// Placeholders for Pages (Will implement next)
import Home from './pages/Student/Home';
import Menu from './pages/Student/Menu';
import Cart from './pages/Student/Cart';
import Checkout from './pages/Student/Checkout';
import Payment from './pages/Student/Payment';
import Confirmation from './pages/Student/Confirmation';
import Assistant from './pages/Student/Assistant';

import StaffLogin from './pages/Staff/StaffLogin';
import StaffDashboard from './pages/Staff/StaffDashboard';

const Navbar = () => (
  <nav className="navbar">
    <Link to="/" className="nav-link" style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Utensils /> Smart Canteen
    </Link>
    <div className="nav-links">
      <Link to="/assistant" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
        <Sparkles size={16} /> Ask AI
      </Link>
      <Link to="/menu" className="nav-link">Menu</Link>
      <Link to="/cart" className="nav-link"><ShoppingCart size={20} /></Link>
      <Link to="/staff/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}><LogIn size={16} /> Staff</Link>
    </div>
  </nav>
);

function App() {
  return (
    <SocketProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <div className="main-layout">
            <Routes>
              {/* Student Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/assistant" element={<Assistant />} />
              
              {/* Staff Routes */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </SocketProvider>
  );
}

export default App;
