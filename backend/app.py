import os
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename 

app = Flask(__name__)
CORS(app) 

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///coffee_shop.db'
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)

# Model Sản phẩm
class CoffeeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "price": self.price, "image_url": self.image_url}

# Model Đơn hàng
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    items = db.Column(db.Text, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Chờ xử lý')

    def to_dict(self):
        return {"id": self.id, "items": self.items, "total_price": self.total_price, "status": self.status}

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
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(filepath)
        image_url = f'/uploads/{filename}'
    new_item = CoffeeItem(name=name, price=float(price), image_url=image_url)
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/api/menu/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = CoffeeItem.query.get_or_404(item_id)
    if 'image' in request.files:
        image_file = request.files['image']
        filename = secure_filename(image_file.filename)
        image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        item.image_url = f'/uploads/{filename}'
    elif request.get_json():
        data = request.get_json()
        item.name = data.get('name', item.name)
        item.price = data.get('price', item.price)
    db.session.commit()
    return jsonify(item.to_dict()), 200

@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    item = CoffeeItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- API ORDERS ---
@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([order.to_dict() for order in orders])

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    items_summary = ", ".join([f"{i['name']} (x{i['quantity']})" for i in data['cart']])
    new_order = Order(items=items_summary, total_price=data['totalPrice'])
    db.session.add(new_order)
    db.session.commit()
    return jsonify(new_order.to_dict()), 201

@app.route('/api/orders/<int:order_id>/complete', methods=['PUT'])
def complete_order(order_id):
    order = Order.query.get_or_404(order_id)
    order.status = 'Đã xong'
    db.session.commit()
    return jsonify(order.to_dict()), 200

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if CoffeeItem.query.count() == 0:
            db.session.add(CoffeeItem(name="Espresso", price=35000, image_url="https://nhanvipcoffee.com.vn/wp-content/uploads/2024/06/780x520-2.jpeg"))
            db.session.add(CoffeeItem(name="Latte", price=42000, image_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR8Q_RrELDLpBSuhHF9CEAWgSBo9mRQtSy-g&s"))
            db.session.add(CoffeeItem(name="Bạc xỉu", price=30000, image_url="vcdn1-dulich.vnecdn.net"))
            db.session.commit()
    app.run(debug=True, port=5000)
