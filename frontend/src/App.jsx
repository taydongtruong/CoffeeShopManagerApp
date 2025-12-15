import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState(null); 
  const [editingItem, setEditingItem] = useState(null); 
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  // State mới để quản lý việc tải ảnh lên
  const [uploadingImageId, setUploadingImageId] = useState(null);

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

  useEffect(() => {
    fetchMenu();
  }, []);

  // Hàm Thêm món (giữ nguyên)
  const handleAddItem = async (event) => {
    // ... (logic handleAddItem giữ nguyên như phiên bản trước) ...
    event.preventDefault(); 
    if (!newItemName || !newItemPrice) return;

    const formData = new FormData();
    formData.append('name', newItemName);
    formData.append('price', parseFloat(newItemPrice));
    if (newItemImage) {
        formData.append('image', newItemImage[0]); // Lấy file đầu tiên
    }

    try {
      const response = await fetch('http://localhost:5000/api/menu', {
        method: 'POST',
        body: formData, 
      });
      
      if (!response.ok) throw new Error('Không thể thêm món mới');
      
      const addedItem = await response.json();
      setMenuItems([...menuItems, addedItem]); 
      setNewItemName('');
      setNewItemPrice('');
      setNewItemImage(null);
      alert("Đã thêm món thành công!");

    } catch (error) {
      console.error("Lỗi khi thêm món: ", error);
      alert("Đã xảy ra lỗi khi thêm món.");
    }
  };

  // Hàm Xóa món (giữ nguyên)
  const handleDeleteItem = async (itemId) => {
    // ... (logic xóa giữ nguyên) ...
    try {
        const response = await fetch(`http://localhost:5000/api/menu/${itemId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Không thể xóa món');
        setMenuItems(menuItems.filter(item => item.id !== itemId));
        alert(`Đã xóa món ID: ${itemId}`);
      } catch (error) {
        console.error("Lỗi khi xóa món: ", error);
        alert("Đã xảy ra lỗi khi xóa món.");
      }
  };
  
  // Hàm Sửa tên/giá (giữ nguyên)
  const startEditing = (item) => {
    setEditingItem(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditName('');
    setEditPrice('');
  };

  const handleUpdateItem = async (event, itemId) => {
    event.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, price: parseFloat(editPrice) }),
      });
      if (!response.ok) throw new Error('Không thể cập nhật món');
      const updatedItem = await response.json();
      setMenuItems(menuItems.map(item => item.id === itemId ? updatedItem : item));
      cancelEditing(); 
      alert(`Đã cập nhật món ID: ${itemId}`);
    } catch (error) {
      console.error("Lỗi khi cập nhật món: ", error);
      alert("Đã xảy ra lỗi khi cập nhật món.");
    }
  };

  // --- HÀM MỚI ĐỂ CẬP NHẬT ẢNH RIÊNG BIỆT ---
  const handleImageChange = async (event, itemId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImageId(itemId);
    const formData = new FormData();
    formData.append('image', file);
    // Vẫn dùng PUT request nhưng chỉ gửi ảnh, backend sẽ xử lý

    try {
      const response = await fetch(`http://localhost:5000/api/menu/${itemId}`, {
        method: 'PUT',
        body: formData, // Gửi FormData chứ không phải JSON
      });

      if (!response.ok) throw new Error('Không thể cập nhật ảnh');
      
      const updatedItem = await response.json();
      // Cập nhật lại danh sách menu với ảnh mới
      setMenuItems(menuItems.map(item => item.id === itemId ? updatedItem : item));
      alert("Đã cập nhật ảnh thành công!");
      setUploadingImageId(null);

    } catch (error) {
      console.error("Lỗi khi cập nhật ảnh: ", error);
      alert("Đã xảy ra lỗi khi cập nhật ảnh.");
      setUploadingImageId(null);
    }
  };


  if (loading) return <div className="App-header">Đang tải danh mục...</div>;
  if (error) return <div className="App-header">Lỗi: {error.message}. Backend có đang chạy không?</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Reak Smaay Coffee Shop (Admin)</h1>

        {/* FORM THÊM MÓN MỚI (giữ nguyên) */}
        <div className="form-container">
            <h3>Thêm Món Mới</h3>
            <form onSubmit={handleAddItem}>
                <input type="text" placeholder="Tên món" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
                <input type="number" step="0.01" placeholder="Giá" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} required />
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setNewItemImage(e.target.files)} />
                <button type="submit">Thêm Món</button>
            </form>
        </div>
        
        {/* DANH SÁCH MENU HIỆN TẠI (Thêm hiển thị ảnh và nút đổi ảnh) */}
        <h2>Thực đơn ({menuItems.length} món)</h2>
        <div className="menu-list">
          {menuItems.map(item => (
            <div key={item.id} className="menu-item">
               {editingItem === item.id ? (
                <form onSubmit={(e) => handleUpdateItem(e, item.id)} className="edit-form">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                    <button type="submit" className="save-btn">Lưu</button>
                    <button type="button" onClick={cancelEditing} className="cancel-btn">Hủy</button>
                </form>
              ) : (
                <>
                  {item.image_url && (
                    <img 
                      src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
                      alt={item.name} 
                      style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px'}} 
                    />
                  )}
                  <span>{item.name}</span>
                  <span>{item.price.toFixed(0)} VNĐ</span>
                  <div className="item-actions">
                    {/* NÚT ĐỔI ẢNH */}
                    <label className="change-image-btn">
                        Đổi ảnh
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageChange(e, item.id)} 
                        />
                    </label>
                    
                    <button onClick={() => startEditing(item)} className="edit-btn" title="Sửa tên/giá">Sửa</button>
                    <button onClick={() => handleDeleteItem(item.id)} className="delete-btn" title="Bạn chắc chắn xoá món này?">Xóa món</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
