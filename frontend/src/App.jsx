import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // ĐỊNH NGHĨA URL BACKEND TẠI ĐÂY ĐỂ DỄ QUẢN LÝ
  const API_BASE_URL = 'https://coffeeshopmanagerapp.onrender.com';

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState(null); 
  const [editingItem, setEditingItem] = useState(null); 
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [uploadingImageId, setUploadingImageId] = useState(null);

  // 1. SỬA LỖI: Thêm đúng endpoint /api/menu
  const fetchMenu = () => {
    fetch(`${API_BASE_URL}/api/menu`)
      .then(response => {
        if (!response.ok) throw new Error('Phản hồi từ server không hợp lệ');
        return response.json();
      })
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

  const handleAddItem = async (event) => {
    event.preventDefault(); 
    if (!newItemName || !newItemPrice) return;

    const formData = new FormData();
    formData.append('name', newItemName);
    formData.append('price', parseFloat(newItemPrice));
    if (newItemImage) {
        formData.append('image', newItemImage[0]);
    }

    try {
      // 2. SỬA LỖI: Thêm đúng endpoint /api/menu
      const response = await fetch(`${API_BASE_URL}/api/menu`, {
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
      alert("Lỗi khi thêm món: " + error.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
        // 3. SỬA LỖI: Thêm đúng endpoint /api/menu/${itemId}
        const response = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Không thể xóa món');
        setMenuItems(menuItems.filter(item => item.id !== itemId));
        alert(`Đã xóa thành công!`);
      } catch (error) {
        alert("Lỗi khi xóa: " + error.message);
      }
  };
  
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
      // 4. SỬA LỖI: Thêm đúng endpoint /api/menu/${itemId}
      const response = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, price: parseFloat(editPrice) }),
      });
      if (!response.ok) throw new Error('Không thể cập nhật');
      const updatedItem = await response.json();
      setMenuItems(menuItems.map(item => item.id === itemId ? updatedItem : item));
      cancelEditing(); 
      alert(`Đã cập nhật xong!`);
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleImageChange = async (event, itemId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImageId(itemId);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // 5. SỬA LỖI: Thêm đúng endpoint /api/menu/${itemId}
      const response = await fetch(`${API_BASE_URL}/api/menu/${itemId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Không thể tải ảnh lên');
      const updatedItem = await response.json();
      setMenuItems(menuItems.map(item => item.id === itemId ? updatedItem : item));
      alert("Cập nhật ảnh thành công!");
    } catch (error) {
      alert("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploadingImageId(null);
    }
  };

  if (loading) return <div className="App-header">Đang tải dữ liệu từ Render...</div>;
  if (error) return <div className="App-header">Lỗi kết nối: {error.message}</div>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Coffee Shop Management (Admin)</h1>

        <div className="form-container">
            <h3>Thêm Món Mới</h3>
            <form onSubmit={handleAddItem}>
                <input type="text" placeholder="Tên món" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
                <input type="number" placeholder="Giá" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} required />
                <input type="file" accept="image/*" onChange={(e) => setNewItemImage(e.target.files)} />
                <button type="submit">Thêm Món</button>
            </form>
        </div>
        
        <h2>Thực đơn ({menuItems.length} món)</h2>
        <div className="menu-list">
          {menuItems.map(item => (
            <div key={item.id} className="menu-item" style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
               {editingItem === item.id ? (
                <form onSubmit={(e) => handleUpdateItem(e, item.id)} className="edit-form">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                    <button type="submit">Lưu</button>
                    <button type="button" onClick={cancelEditing}>Hủy</button>
                </form>
              ) : (
                <>
                  <img 
                    // 6. SỬA LỖI: Ghép nối URL ảnh đúng cách từ Backend Render
                    src={item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`) : 'via.placeholder.com'} 
                    alt={item.name} 
                    style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px', marginRight: '15px'}} 
                  />
                  <div style={{textAlign: 'left', flexGrow: 1}}>
                    <div style={{fontWeight: 'bold'}}>{item.name}</div>
                    <div style={{fontSize: '0.9em'}}>{item.price.toLocaleString()} VNĐ</div>
                  </div>
                  <div className="item-actions">
                    <label className="change-image-btn" style={{cursor: 'pointer', color: '#61dafb', marginRight: '10px'}}>
                        {uploadingImageId === item.id ? "Đang tải..." : "Đổi ảnh"}
                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleImageChange(e, item.id)} />
                    </label>
                    <button onClick={() => startEditing(item)}>Sửa</button>
                    <button onClick={() => handleDeleteItem(item.id)} style={{color: 'red'}}>Xóa</button>
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
