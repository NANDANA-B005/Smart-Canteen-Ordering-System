import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('canteen_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('canteen_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        // Prevent exceeding stock
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, productId: product._id }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === id) {
          const newQ = item.quantity + delta;
          if (newQ < 1) return item;
          // In a real app we'd verify against live stock here too
          return { ...item, quantity: newQ };
        }
        return item;
      });
    });
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};
