import streamlit as st
import requests
from io import BytesIO
from PIL import Image
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- CẤU HÌNH DATABASE ---
Base = declarative_base()
engine = create_engine('sqlite:///coffee_shop.db', connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

class CoffeeItem(Base):
    __tablename__ = "coffee_item"
    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)

class Order(Base):
    __tablename__ = "order"
    id = Column(Integer, primary_key=True)
    items = Column(Text, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default='Chờ xử lý')

Base.metadata.create_all(bind=engine)

# --- HÀM TẢI ẢNH AN TOÀN ---
def load_image(url):
    """Tải ảnh từ URL và chuyển thành đối tượng PIL để tránh lỗi MediaFileStorageError"""
    default_img = Image.new('RGB', (150, 150), color = (200, 200, 200))
    if not url or not url.startswith("http"):
        return default_img
    try:
        response = requests.get(url, timeout=5)
        return Image.open(BytesIO(response.content))
    except Exception:
        return default_img

# --- DỮ LIỆU MẪU ---
if db.query(CoffeeItem).count() == 0:
    db.add_all([
        CoffeeItem(name="Espresso", price=35000, image_url="nhanvipcoffee.com.vn"),
        CoffeeItem(name="Latte", price=42000, image_url="images.unsplash.com"),
        CoffeeItem(name="Bạc xỉu", price=30000, image_url="vcdn1-dulich.vnecdn.net")
    ])
    db.commit()

# --- GIAO DIỆN ---
st.set_page_config(page_title="Coffee Shop Manager 2025", layout="wide")
st.title("☕ Coffee Shop System")

menu = ["🛒 Bán hàng", "📦 Quản lý thực đơn", "📋 Danh sách đơn hàng"]
choice = st.sidebar.selectbox("Menu", menu)

if choice == "🛒 Bán hàng":
    st.header("Thực đơn")
    items = db.query(CoffeeItem).all()
    if "cart" not in st.session_state: st.session_state.cart = {}

    cols = st.columns(3)
    for idx, item in enumerate(items):
        with cols[idx % 3]:
            # Sử dụng hàm load_image để hiển thị an toàn
            img = load_image(item.image_url)
            st.image(img, use_container_width=True)
            st.subheader(item.name)
            st.write(f"{item.price:,.0f} VNĐ")
            if st.button(f"Thêm {item.name}", key=f"add_{item.id}"):
                st.session_state.cart[item.name] = st.session_state.cart.get(item.name, 0) + 1
                st.toast(f"Đã thêm {item.name}")

    # Sidebar Giỏ hàng
    st.sidebar.header("🛒 Giỏ hàng")
    total = 0
    summary = []
    for n, q in st.session_state.cart.items():
        it = next((i for i in items if i.name == n), None)
        if it:
            total += it.price * q
            st.sidebar.write(f"{n} x{q}")
            summary.append(f"{n} (x{q})")
    
    st.sidebar.subheader(f"Tổng: {total:,.0f} VNĐ")
    if st.sidebar.button("Đặt hàng") and summary:
        db.add(Order(items=", ".join(summary), total_price=total))
        db.commit()
        st.session_state.cart = {}
        st.sidebar.success("Thành công!")
        st.rerun()

elif choice == "📦 Quản lý thực đơn":
    st.header("Cài đặt thực đơn")
    with st.form("add_item"):
        n = st.text_input("Tên món")
        p = st.number_input("Giá", min_value=0)
        u = st.text_input("Link ảnh (URL)")
        if st.form_submit_button("Thêm"):
            db.add(CoffeeItem(name=n, price=p, image_url=u))
            db.commit()
            st.rerun()

    for item in db.query(CoffeeItem).all():
        with st.container(border=True):
            c1, c2, c3 = st.columns([3,2,1])
            c1.write(item.name)
            c2.write(f"{item.price:,.0f} VNĐ")
            if c3.button("Xóa", key=f"del_{item.id}"):
                db.delete(item)
                db.commit()
                st.rerun()

elif choice == "📋 Danh sách đơn hàng":
    st.header("Đơn hàng")
    for order in db.query(Order).order_by(Order.id.desc()).all():
        with st.container(border=True):
            st.write(f"Đơn #{order.id} - {order.items}")
            st.write(f"Tổng: {order.total_price:,.0f} VNĐ - Trạng thái: {order.status}")
            if order.status == 'Chờ xử lý' and st.button("Hoàn tất", key=f"f_{order.id}"):
                order.status = 'Đã xong'
                db.commit()
                st.rerun()
