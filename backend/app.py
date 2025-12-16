import os
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app) # Cho phép Frontend truy cập API

# Cấu hình đường dẫn tuyệt đối cho Database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'coffee_shop.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'uploads')

# Tạo thư mục uploads nếu chưa có
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db = SQLAlchemy(app)

# --- MODELS ---
class CoffeeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "price": self.price, "image_url": self.image_url}

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    items = db.Column(db.Text, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Chờ xử lý')

    def to_dict(self):
        return {"id": self.id, "items": self.items, "total_price": self.total_price, "status": self.status}

@app.route('/')
def home():
    return jsonify({"status": "Server is running", "message": "Coffee Shop API"}), 200

# --- API MENU ---
@app.route('/api/menu', methods=['GET'])
def get_menu():
    items = CoffeeItem.query.all()
    return jsonify([item.to_dict() for item in items])

@app.route('/api/menu', methods=['POST'])
def add_item():
    name = request.form.get('name')
    price = request.form.get('price')
    image_file = request.files.get('image')
    
    if not name or not price:
        return jsonify({"message": "Thiếu tên hoặc giá"}), 400
    
    image_url = None
    if image_file:
        filename = secure_filename(image_file.filename)
        image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_url = f'/uploads/{filename}'
        
    new_item = CoffeeItem(name=name, price=float(price), image_url=image_url)
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/api/menu/<int:item_id>', methods=['PUT', 'DELETE'])
def manage_item(item_id):
    item = CoffeeItem.query.get_or_404(item_id)
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    
    # Logic Update (PUT)
    data = request.get_json()
    if data:
        item.name = data.get('name', item.name)
        item.price = data.get('price', item.price)
    db.session.commit()
    return jsonify(item.to_dict()), 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- API ORDERS ---
@app.route('/api/orders', methods=['GET', 'POST'])
def manage_orders():
    if request.method == 'POST':
        data = request.get_json()
        items_summary = ", ".join([f"{i['name']} (x{i['quantity']})" for i in data['cart']])
        new_order = Order(items=items_summary, total_price=data['totalPrice'])
        db.session.add(new_order)
        db.session.commit()
        return jsonify(new_order.to_dict()), 201
    
    orders = Order.query.all()
    return jsonify([order.to_dict() for order in orders])

@app.route('/api/orders/<int:order_id>/complete', methods=['PUT'])
def complete_order(order_id):
    order = Order.query.get_or_404(order_id)
    order.status = 'Đã xong'
    db.session.commit()
    return jsonify(order.to_dict()), 200

# --- CHẠY SERVER ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Dữ liệu mẫu ban đầu
        if CoffeeItem.query.count() == 0:
            db.session.add(CoffeeItem(name="Espresso", price=35000))
            db.session.commit()
            
    # Lấy PORT từ hệ thống (quan trọng khi deploy lên Render/Railway)
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
