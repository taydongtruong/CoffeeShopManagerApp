import streamlit as st
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- CẤU HÌNH DATABASE ---
Base = declarative_base()
engine = create_engine('sqlite:///coffee_shop.db', connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# --- MODELS ---
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

# Link ảnh mặc định an toàn (Phải có https://)
DEFAULT_IMAGE = "images.unsplash.com"

# Thêm dữ liệu mẫu nếu DB trống
if db.query(CoffeeItem).count() == 0:
    db.add_all([
        CoffeeItem(name="Espresso", price=35000, image_url="nhanvipcoffee.com.vn"),
        CoffeeItem(name="Latte", price=42000, image_url="images.unsplash.com"),
        CoffeeItem(name="Bạc xỉu", price=30000, image_url="vcdn1-dulich.vnecdn.net")
    ])
    db.commit()

st.set_page_config(page_title="Coffee Shop 2025", layout="wide")
st.title("☕ Coffee Shop Management System")

menu = ["🛒 Bán hàng", "📦 Quản lý thực đơn", "📋 Danh sách đơn hàng"]
choice = st.sidebar.selectbox("Chức năng", menu)

if choice == "🛒 Bán hàng":
    st.header("Thực đơn")
    items = db.query(CoffeeItem).all()
    
    if "cart" not in st.session_state:
        st.session_state.cart = {}

    cols = st.columns(3)
    for idx, item in enumerate(items):
        with cols[idx % 3]:
            # CƠ CHẾ SỬA LỖI: Kiểm tra URL và bao bọc trong khối try-except
            url_to_show = item.image_url if (item.image_url and item.image_url.startswith("http")) else DEFAULT_IMAGE
            try:
                st.image(url_to_show, use_container_width=True)
            except Exception:
                # Nếu URL hỏng, dùng ảnh mặc định
                st.image(DEFAULT_IMAGE, use_container_width=True)
                
            st.subheader(f"{item.name}")
            st.write(f"Giá: {item.price:,.0f} VNĐ")
            if st.button(f"Thêm {item.name}", key=f"add_{item.id}"):
                st.session_state.cart[item.name] = st.session_state.cart.get(item.name, 0) + 1
                st.toast(f"Đã thêm {item.name}")

    # Giỏ hàng
    st.sidebar.header("🛒 Giỏ hàng")
    total_price = 0
    cart_summary = []
    for name, qty in st.session_state.cart.items():
        item_data = next((i for i in items if i.name == name), None)
        if item_data:
            p = item_data.price
            total_price += p * qty
            st.sidebar.write(f"{name} x{qty}: {p*qty:,.0f} VNĐ")
            cart_summary.append(f"{name} (x{qty})")

    st.sidebar.subheader(f"Tổng: {total_price:,.0f} VNĐ")
    if st.sidebar.button("Đặt hàng") and st.session_state.cart:
        new_order = Order(items=", ".join(cart_summary), total_price=total_price)
        db.add(new_order)
        db.commit()
        st.session_state.cart = {}
        st.sidebar.success("Đặt hàng thành công!")
        st.rerun()

elif choice == "📦 Quản lý thực đơn":
    st.header("Quản lý món ăn")
    with st.expander("➕ Thêm món mới"):
        with st.form("add_item_form"):
            new_name = st.text_input("Tên món")
            new_price = st.number_input("Giá", min_value=0)
            new_img = st.text_input("Link ảnh (Phải bắt đầu bằng http:// hoặc https://)")
            if st.form_submit_button("Lưu"):
                if new_name and new_price > 0:
                    item = CoffeeItem(name=new_name, price=new_price, image_url=new_img)
                    db.add(item)
                    db.commit()
                    st.success("Đã thêm món!")
                    st.rerun()

    items = db.query(CoffeeItem).all()
    for item in items:
        with st.container(border=True):
            col1, col2, col3 = st.columns([2, 1, 1])
            col1.write(f"**{item.name}**")
            col2.write(f"{item.price:,.0f} VNĐ")
            if col3.button("Xóa", key=f"del_{item.id}"):
                db.delete(item)
                db.commit()
                st.rerun()

elif choice == "📋 Danh sách đơn hàng":
    st.header("Đơn hàng")
    orders = db.query(Order).order_by(Order.id.desc()).all()
    for order in orders:
        with st.container(border=True):
            c1, c2, c3, c4 = st.columns([1, 4, 2, 2])
            c1.write(f"#{order.id}")
            c2.write(f"{order.items}")
            c3.write(f"**{order.total_price:,.0f} VNĐ**")
            if order.status == 'Chờ xử lý':
                if c4.button("Xong", key=f"done_{order.id}"):
                    order.status = 'Đã xong'
                    db.commit()
                    st.rerun()
            else:
                c4.success("✅ Xong")
