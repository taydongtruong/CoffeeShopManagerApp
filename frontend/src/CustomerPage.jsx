import { useState, useEffect } from 'react';
import './CustomerPage.css';

function CustomerPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State quản lý giỏ hàng
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/menu')
      .then(response => response.json())
      .then(data => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  // Hàm thêm vào giỏ: Tự động cộng dồn số lượng nếu trùng món
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Hàm xóa bớt món khỏi giỏ
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return <div className="customer-page-container">⚡ Đang chuẩn bị menu...</div>;
  if (error) return <div className="customer-page-container">Lỗi kết nối: {error.message}</div>;

  return (
    <div className="customer-page-container">
      <div className="customer-header">
        <h1>Reak Smaay Coffee</h1>
        <p>Hương vị cà phê nguyên bản cho ngày mới năng động</p>
      </div>

      {/* Lưới sản phẩm */}
      <div className="customer-menu-grid">
        {menuItems.map(item => (
          <div key={item.id} className="customer-item-card">
            <img 
              src={item.image_url?.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
              alt={item.name} 
              className="item-image"
              // Sửa lỗi URL placeholder
              onError={(e) => e.target.src = 'via.placeholder.com'}
            />
            <div className="item-info">
              <h3>{item.name}</h3>
              <p style={{color: '#a05a2c', fontWeight: 'bold', fontSize: '1.2rem'}}>
                {item.price.toLocaleString()} VNĐ
              </p>
              <button className="add-to-cart-btn" onClick={() => addToCart(item)}>
                + Thêm vào giỏ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* GIỎ HÀNG (Đã được khôi phục đầy đủ) */}
      {cart.length > 0 && (
        <div className="cart-summary">
          <h3>🛒 Giỏ hàng của bạn</h3>
          <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '15px'}}>
            {cart.map(item => (
              <div key={item.id} className="cart-item-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                <div style={{textAlign: 'left'}}>
                  <div style={{fontWeight: 'bold'}}>{item.name}</div>
                  <small>Số lượng: {item.quantity}</small>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontWeight: '500'}}>{(item.price * item.quantity).toLocaleString()}đ</span>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    style={{border: 'none', background: '#ff4d4d', color: 'white', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="total-price" style={{borderTop: '2px solid #a05a2c', paddingTop: '10px', textAlign: 'right'}}>
            <span style={{fontSize: '1rem'}}>Tổng tiền:</span>
            <div style={{fontSize: '1.5rem', color: '#a05a2c'}}>{totalPrice.toLocaleString()} VNĐ</div>
          </div>
          <button className="checkout-btn" onClick={() => alert("Cảm ơn bạn! Đơn hàng đã được ghi nhận.")}>
            XÁC NHẬN ĐẶT HÀNG
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
