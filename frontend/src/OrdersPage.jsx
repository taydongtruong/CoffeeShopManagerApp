import { useState, useEffect } from 'react';
import './OrdersPage.css';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Hàm lấy danh sách đơn hàng
  const fetchOrders = () => {
    fetch('http://localhost:5000/api/orders')
      .then(response => response.json())
      .then(data => {
        // Đảo ngược để đơn mới nhất ở trên
        setOrders([...data].reverse());
        setLoading(false);
      })
      .catch(error => console.error("Lỗi tải đơn hàng:", error));
  };

  // 2. Hàm đánh dấu hoàn thành đơn hàng (Sử dụng API PUT)
  const completeOrder = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/complete`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchOrders(); // Tải lại danh sách để cập nhật trạng thái
      }
    } catch (error) {
      console.error("Lỗi cập nhật đơn hàng:", error);
    }
  };

  // 3. Hàm xóa đơn hàng (Sử dụng API DELETE)
  const deleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Lỗi xóa đơn hàng:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Tự động làm mới mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="App-header">⚡ Đang kết nối hệ thống đơn hàng...</div>;

  return (
  <div className="App" style={{ backgroundColor: '#1a1d21', minHeight: '100vh', color: 'white', padding: '20px' }}>
    <div className="orders-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
      <h1 style={{ color: '#28a745', fontSize: '2.5rem' }}>📋 QUẢN LÝ ĐƠN HÀNG</h1>
      <p style={{ color: '#888' }}>Giao diện dành cho nhân viên xử lý món (Tự động cập nhật mỗi 10s)</p>
    </div>

    {/* CONTAINER DÀN HÀNG NGANG */}
    <div className="orders-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', // Tự động chia cột khi màn hình rộng
      gap: '20px',
      maxWidth: '1300px',
      margin: '0 auto'
    }}>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', gridColumn: '1/-1' }}>Hiện chưa có đơn hàng nào từ khách.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{
            background: '#2d3238',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'left',
            borderLeft: order.status === 'Đã xong' ? '10px solid #888' : '10px solid #28a745',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
            opacity: order.status === 'Đã xong' ? 0.6 : 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Mã đơn: #{order.id}</span>
                <span style={{
                  background: order.status === 'Đã xong' ? '#555' : '#28a745',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>{order.status}</span>
              </div>

              <div style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#61dafb', lineHeight: '1.6' }}>
                🛒 <strong>Món:</strong> {order.items}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #444', paddingTop: '15px' }}>
              <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '1.3rem' }}>
                {order.total_price.toLocaleString()} VNĐ
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                {order.status !== 'Đã xong' && (
                  <button
                    onClick={() => completeOrder(order.id)}
                    style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#28a745', color: 'white', fontWeight: 'bold' }}
                  >
                    Hoàn thành
                  </button>
                )}
                <button
                  onClick={() => deleteOrder(order.id)}
                  style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#ff4d4d', color: 'white' }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

}

export default OrdersPage;
