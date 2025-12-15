from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
# Cho phép CORS cho phép mọi nguồn gốc (để phát triển cục bộ)
CORS(app) 

# Cấu hình cơ sở dữ liệu SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///coffee_shop.db'
db = SQLAlchemy(app)

# --- Định nghĩa Model Cơ sở dữ liệu ---
class CoffeeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "price": self.price}

# --- Định nghĩa Routes API ---

@app.route('/api/menu', methods=['GET'])
def get_menu():
    items = CoffeeItem.query.all()
    return jsonify([item.to_dict() for item in items])

@app.route('/api/menu', methods=['POST'])
def add_item():
    data = request.get_json()
    new_item = CoffeeItem(name=data['name'], price=data['price'])
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

# --- THÊM ROUTE XÓA MỚI TẠI ĐÂY ---
@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    item = CoffeeItem.query.get_or_404(item_id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": f"Món ID {item_id} đã bị xóa"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Lỗi khi xóa: {str(e)}"}), 500

# --- Chạy ứng dụng ---
if __name__ == '__main__':
    # Tạo cơ sở dữ liệu và bảng nếu chưa tồn tại
    with app.app_context():
        db.create_all()
        # Thêm dữ liệu mẫu lần đầu chạy
        if CoffeeItem.query.count() == 0:
            db.session.add(CoffeeItem(name="Espresso", price=3.50))
            db.session.add(CoffeeItem(name="Latte", price=4.20))
            db.session.commit()
            print("Đã thêm dữ liệu mẫu.")
            
    app.run(debug=True, port=5000)

