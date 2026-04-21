import { useState, useRef, useEffect, useContext } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { CartContext } from '../../context/CartContext';

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your Canteen AI Assistant. What are you craving today? You can ask me for recommendations like 'Suggest something spicy under 60'." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToCart } = useContext(CartContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSubmit) => {
    const text = textToSubmit || input;
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
          role: 'bot', 
          text: data.reply || "I couldn't quite understand that, but here are some options:", 
          items: data.recommendations || []
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: "Oops, my circuits are tangled! Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Suggest something spicy under 60",
    "I want a juice and a snack",
    "Give me a light evening combo",
    "Recommend a filling meal under 100"
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot size={32} color="var(--primary)" />
        <h1 className="heading" style={{ margin: 0 }}>Ask AI Assistant</h1>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
        
        {/* Chat window */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} color="var(--primary)" />}
                </div>

                <div style={{
                  background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-light)',
                  padding: '1rem',
                  borderRadius: msg.role === 'user' ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem',
                  border: msg.role === 'bot' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}>
                  <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.text}</p>
                </div>
              </div>

              {/* Recommended Items */}
              {msg.items && msg.items.length > 0 && (
                <div style={{ marginTop: '0.5rem', marginLeft: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {msg.items.map(item => (
                    <div key={item._id} style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      width: '200px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.name}</h4>
                        <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>₹{item.price}</p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.counter} Counter</p>
                      </div>
                      <button 
                         className="btn" 
                         style={{ marginTop: '0.5rem', padding: '0.4rem' }}
                         onClick={() => addToCart(item)}
                      >
                         Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', marginLeft: '3rem', color: 'var(--text-muted)' }}>
              <i>AI is typing...</i>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ marginTop: '1rem' }}>
          
          {/* Sample Prompts */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {samplePrompts.map((prompt, idx) => (
                <button 
                  key={idx}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '20px' }}
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for food recommendations..."
              style={{ flex: 1, borderRadius: '20px', paddingLeft: '1.5rem' }}
              disabled={loading}
            />
            <button 
              className="btn" 
              onClick={() => handleSend()}
              style={{ borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              disabled={loading || !input.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
