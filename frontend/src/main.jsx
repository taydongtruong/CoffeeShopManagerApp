import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx'; // Trang Admin
import CustomerPage from './CustomerPage.jsx'; // Trang Khách hàng
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Bọc ứng dụng trong BrowserRouter */}
    <BrowserRouter>
      <Routes>
        {/* Route mặc định cho khách hàng: http://localhost:5173/ */}
        <Route path="/" element={<CustomerPage />} />
        
        {/* Route cho Admin: http://localhost:5173/admin */}
        <Route path="/admin" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
