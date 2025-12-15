import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Hàm tải dữ liệu menu từ API
  const fetchMenu = () => {
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
  };

  // Tải menu khi component được mount
  useEffect(() => {
    fetchMenu();
  }, []);

  // Hàm xử lý việc thêm món mới
  const handleAddItem = async (event) => {
    event.preventDefault(); // Ngăn chặn form submit làm refresh trang

    if (!newItemName || !newItemPrice) return;

    try {
      const response = await fetch('http://localhost:5000/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newItemName, 
          price: parseFloat(newItemPrice) // Đảm bảo gửi dạng số
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể thêm món mới');
      }

      const addedItem = await response.json();
      
      // Cập nhật state menuItems ngay lập tức với món mới
      setMenuItems([...menuItems, addedItem]); 
      
      // Xóa dữ liệu trong form sau khi thêm
      setNewItemName('');
      setNewItemPrice('');

    } catch (error) {
      console.error("Lỗi khi thêm món: ", error);
      alert("Đã xảy ra lỗi khi thêm món.");
    }
  };

  // Hàm xử lý việc xóa món
  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/menu/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Không thể xóa món');
      }

      // Cập nhật state menuItems bằng cách lọc bỏ món vừa xóa
      setMenuItems(menuItems.filter(item => item.id !== itemId));
      
      alert(`Đã xóa món ID: ${itemId}`);

    } catch (error) {
      console.error("Lỗi khi xóa món: ", error);
      alert("Đã xảy ra lỗi khi xóa món.");
    }
  };

  if (loading) return <div className="App-header">Đang tải danh mục...</div>;
  if (error) return <div className="App-header">Lỗi: {error.message}. Backend có đang chạy không?</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Reak Smaay Coffee Shop</h1>

        {/* --- FORM THÊM MÓN MỚI --- */}
        <div className="form-container">
            <h3>Thêm Món Mới</h3>
            <form onSubmit={handleAddItem}>
                <input
                    type="text"
                    placeholder="Tên món (ví dụ: Cà phê đá)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                />
                <input
                    type="number"
                    step="1000"
                    placeholder="Giá (ví dụ: 10.000vnđ)"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    required
                />
                <button type="submit">Thêm Thức uống</button>
            </form>
        </div>
        
        {/* --- DANH SÁCH MENU HIỆN TẠI --- */}
        <h2>Thực đơn ({menuItems.length} món)</h2>
        <div className="menu-list">
          {menuItems.map(item => (
            <div key={item.id} className="menu-item">
              <span>{item.name}</span>
              <span>{item.price.toFixed(0)} VNĐ</span>
              <button 
                onClick={() => handleDeleteItem(item.id)} 
                className="delete-btn"
                title="Bạn chắc chắn xoá món này?"
              >
                Xóa món
              </button>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
