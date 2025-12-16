import { useState, useEffect } from 'react';
import './CustomerPage.css';

function CustomerPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch('https://coffeeshopmanagerapp.onrender.com')
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

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // HÀM XỬ LÝ ĐẶT HÀNG THỰC TẾ (KẾT NỐI BACKEND)
  const handleCheckout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart: cart, 
          totalPrice: totalPrice 
        }),
      });

      if (response.ok) {
        alert("🎉 Đặt hàng thành công! Đơn hàng đã được gửi đến quán.");
        setCart([]); // Xóa giỏ hàng sau khi đặt thành công
      } else {
        alert("Có lỗi xảy ra khi gửi đơn hàng.");
      }
    } catch (err) {
      alert("Không thể kết nối đến máy chủ.");
    }
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

      <div className="customer-menu-grid">
        {menuItems.map(item => (
          <div key={item.id} className="customer-item-card">
            <img 
              src={item.image_url?.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
              alt={item.name} 
              className="item-image"
              // Đã sửa lại link placeholder chuẩn
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

      {cart.length > 0 && (
        <div className="cart-summary">
          <h3>🛒 Giỏ hàng của bạn</h3>
          <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '15px'}}>
            {cart.map(item => (
              <div key={item.id} className="cart-item-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                <div style={{textAlign: 'left'}}>
                  <div style={{fontWeight: 'bold', color: '#333'}}>{item.name}</div>
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
            <span style={{fontSize: '1rem', color: '#666'}}>Tổng cộng:</span>
            <div style={{fontSize: '1.5rem', color: '#a05a2c', fontWeight: 'bold'}}>{totalPrice.toLocaleString()} VNĐ</div>
          </div>
          {/* Đã cập nhật hàm xử lý đặt hàng thực tế */}
          <button className="checkout-btn" onClick={handleCheckout}>
            XÁC NHẬN ĐẶT HÀNG
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
