import os
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
# Import secure_filename để xử lý an toàn tên file tải lên
from werkzeug.utils import secure_filename 

app = Flask(__name__)
# Cho phép CORS cho phép mọi nguồn gốc (để phát triển cục bộ)
CORS(app) 

# Cấu hình cơ sở dữ liệu SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///coffee_shop.db'
db = SQLAlchemy(app)

# Cấu hình thư mục uploads (vẫn giữ để dùng cho chức năng POST/admin)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Định nghĩa Model Cơ sở dữ liệu ---
class CoffeeItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, 
            "name": self.name, 
            "price": self.price,
            "image_url": self.image_url
        }

# --- Định nghĩa Routes API ---

@app.route('/api/menu', methods=['GET'])
def get_menu():
    items = CoffeeItem.query.all()
    return jsonify([item.to_dict() for item in items])

# Cập nhật route POST để xử lý FormData (gồm text và file)
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
        image_url = f'/uploads/{filename}' # Lưu đường dẫn tương đối

    new_item = CoffeeItem(name=name, price=float(price), image_url=image_url)
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

# Thêm route để phục vụ file tĩnh (hình ảnh) từ thư mục uploads
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


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

# Cập nhật route PUT để xử lý cả JSON và FormData (ảnh)
@app.route('/api/menu/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    item = CoffeeItem.query.get_or_404(item_id)
    
    # Kiểm tra xem request có chứa file (FormData) hay không
    if 'image' in request.files:
        # Xử lý cập nhật ảnh
        image_file = request.files['image']
        if image_file:
            filename = secure_filename(image_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(filepath)
            item.image_url = f'/uploads/{filename}' # Cập nhật URL ảnh mới
    
    # Kiểm tra xem request có chứa dữ liệu JSON (sửa tên/giá) hay không
    elif request.get_json():
        data = request.get_json()
        item.name = data.get('name', item.name)
        item.price = data.get('price', item.price)

    db.session.commit()
    return jsonify(item.to_dict()), 200


# --- Chạy ứng dụng ---
if __name__ == '__main__':
    # Tạo cơ sở dữ liệu và bảng nếu chưa tồn tại
    with app.app_context():
        db.create_all()
        # Thêm dữ liệu mẫu lần đầu chạy (SỬA URL ĐÚNG ĐỊNH DẠNG HTTPS://)
        if CoffeeItem.query.count() == 0:
            db.session.add(CoffeeItem(name="Espresso", price=35000, image_url="https://nhanvipcoffee.com.vn/wp-content/uploads/2024/06/780x520-2.jpeg"))
            db.session.add(CoffeeItem(name="Latte", price=42000, image_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR8Q_RrELDLpBSuhHF9CEAWgSBo9mRQtSy-g&s"))
            db.session.add(CoffeeItem(name="Cà phê sữa đá", price=30000, image_url="images.unsplash.com"))
            db.session.commit()
            print("Đã thêm dữ liệu mẫu.")
            
    app.run(debug=True, port=5000)
