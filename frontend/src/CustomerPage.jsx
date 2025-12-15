import { useState, useEffect } from 'react';
import './CustomerPage.css'; 

function CustomerPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="customer-page-container">Đang tải thực đơn...</div>;
  if (error) return <div className="customer-page-container">Lỗi: {error.message}</div>;

  return (
    <div className="customer-page-container">
      <header className="customer-header">
        <h1>Chào mừng đến với Reak Smaay Coffee Shop</h1>
        <p>Chọn món yêu thích của bạn từ menu bên dưới:</p>

        <h2>Thực đơn ({menuItems.length} món)</h2>
        <div className="customer-menu-grid">
          {menuItems.map(item => (
            <div key={item.id} className="customer-item-card">
              {/* HIỂN THỊ HÌNH ẢNH TẠI ĐÂY */}
              {item.image_url ? (
                <img 
                  src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
                  alt={item.name} 
                  className="item-image"
                />
              ) : (
                <div className="placeholder-image">Không có ảnh</div>
              )}
              
              <div className="item-info">
                <h3>{item.name}</h3>
                <p>{item.price.toFixed(0)} VNĐ</p>
              </div>
              {/* Nút thêm vào giỏ hàng sẽ ở đây sau */}
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default CustomerPage;
