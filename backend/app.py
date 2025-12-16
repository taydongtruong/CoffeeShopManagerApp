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

# --- CẤU HÌNH GIAO DIỆN (CSS) ---
st.set_page_config(page_title="Coffee Shop Pro 2025", layout="wide", page_icon="☕")

st.markdown("""
    <style>
    /* Tổng thể */
    .stApp { background-color: #fcfaf7; }
    
    /* Card sản phẩm */
    .coffee-card {
        background-color: white;
        border-radius: 15px;
        padding: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        border: 1px solid #eee;
        margin-bottom: 20px;
        transition: transform 0.2s;
    }
    .coffee-card:hover { transform: translateY(-5px); }
    
    /* Font và Tiêu đề */
    h1, h2, h3 { color: #4b3832; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    
    /* Sidebar */
    [data-testid="stSidebar"] { background-color: #4b3832; color: white; }
    [data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2 { color: #be9b7b; }
    
    /* Nút bấm */
    .stButton>button {
        border-radius: 20px;
        background-color: #be9b7b;
        color: white;
        border: none;
        width: 100%;
    }
    .stButton>button:hover {
        background-color: #4b3832;
        color: #be9b7b;
        border: 1px solid #be9b7b;
    }
    </style>
""", unsafe_allow_html=True)

# --- HÀM TẢI ẢNH AN TOÀN ---
def load_image(url):
    default_img = Image.new('RGB', (300, 200), color = (230, 230, 230))
    if not url or not url.startswith("http"): return default_img
    try:
        response = requests.get(url, timeout=5)
        img = Image.open(BytesIO(response.content))
        return img.resize((300, 200)) # Chuẩn hóa kích thước
    except: return default_img

# --- DỮ LIỆU MẪU ---
if db.query(CoffeeItem).count() == 0:
    db.add_all([
        CoffeeItem(name="Espresso Đậm Đà", price=35000, image_url="images.unsplash.com"),
        CoffeeItem(name="Cà Phê Latte", price=45000, image_url="images.unsplash.com"),
        CoffeeItem(name="Bạc Xỉu Sài Gòn", price=30000, image_url="images.unsplash.com")
    ])
    db.commit()

# --- SIDEBAR & MENU ---
st.sidebar.title("☕ COFFEE MANAGER")
choice = st.sidebar.radio("CHỨC NĂNG", ["🛒 BÁN HÀNG", "📋 ĐƠN HÀNG", "⚙️ CÀI ĐẶT"])

# --- CHỨC NĂNG 1: BÁN HÀNG ---
if choice == "🛒 BÁN HÀNG":
    st.title("🍂 Thực Đơn Hôm Nay")
    items = db.query(CoffeeItem).all()
    if "cart" not in st.session_state: st.session_state.cart = {}

    cols = st.columns(4)
    for idx, item in enumerate(items):
        with cols[idx % 4]:
            st.markdown(f'<div class="coffee-card">', unsafe_allow_html=True)
            img = load_image(item.image_url)
            st.image(img, use_container_width=True)
            st.subheader(item.name)
            st.write(f"💰 {item.price:,.0f} VNĐ")
            if st.button(f"➕ Thêm", key=f"add_{item.id}"):
                st.session_state.cart[item.name] = st.session_state.cart.get(item.name, 0) + 1
                st.toast(f"Đã thêm {item.name}!")
            st.markdown('</div>', unsafe_allow_html=True)

    # GIỎ HÀNG SIDEBAR
    st.sidebar.markdown("---")
    st.sidebar.header("📝 Đơn hàng mới")
    total = 0
    summary = []
    for n, q in st.session_state.cart.items():
        it = next((i for i in items if i.name == n), None)
        if it:
            total += it.price * q
            st.sidebar.write(f"• {n} (x{q})")
            summary.append(f"{n} (x{q})")
    
    st.sidebar.subheader(f"Tổng: {total:,.0f} VNĐ")
    if st.sidebar.button("🚀 ĐẶT HÀNG NGAY") and summary:
        db.add(Order(items=", ".join(summary), total_price=total))
        db.commit()
        st.session_state.cart = {}
        st.sidebar.success("Đã gửi đơn xuống bếp!")
        st.balloons()
        st.rerun()

# --- CHỨC NĂNG 2: ĐƠN HÀNG ---
elif choice == "📋 ĐƠN HÀNG":
    st.title("📋 Quản Lý Đơn Hàng")
    orders = db.query(Order).order_by(Order.id.desc()).all()
    
    for order in orders:
        with st.container(border=True):
            c1, c2, c3 = st.columns([1, 4, 2])
            c1.markdown(f"### #{order.id}")
            c2.write(f"**Sản phẩm:** {order.items}")
            c2.write(f"**Tổng tiền:** {order.total_price:,.0f} VNĐ")
            
            if order.status == 'Chờ xử lý':
                if c3.button("✅ Hoàn tất", key=f"f_{order.id}"):
                    order.status = 'Đã xong'
                    db.commit()
                    st.rerun()
                c3.warning("⌛ Đang chờ")
            else:
                c3.success("✅ Đã hoàn thành")
                if c3.button("🗑️ Xóa", key=f"del_{order.id}"):
                    db.delete(order)
                    db.commit()
                    st.rerun()

# --- CHỨC NĂNG 3: CÀI ĐẶT ---
elif choice == "⚙️ CÀI ĐẶT":
    st.title("⚙️ Cài Đặt Thực Đơn")
    with st.expander("➕ Thêm món mới vào menu"):
        with st.form("add_item"):
            n = st.text_input("Tên món (Ví dụ: Cà phê Muối)")
            p = st.number_input("Giá tiền (VNĐ)", min_value=0, step=1000)
            u = st.text_input("Link ảnh (Copy từ Google Images)")
            if st.form_submit_button("Lưu món"):
                db.add(CoffeeItem(name=n, price=p, image_url=u))
                db.commit()
                st.success("Đã thêm món mới thành công!")
                st.rerun()

    st.subheader("📋 Danh sách món hiện tại")
    for item in db.query(CoffeeItem).all():
        with st.container(border=True):
            col1, col2, col3 = st.columns([3, 2, 1])
            col1.write(f"**{item.name}**")
            col2.write(f"{item.price:,.0f} VNĐ")
            if col3.button("Xóa món", key=f"del_item_{item.id}"):
                db.delete(item)
                db.commit()
                st.rerun()
