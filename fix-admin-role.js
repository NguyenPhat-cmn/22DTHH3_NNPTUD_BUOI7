let mongoose = require('mongoose');
let userModel = require('./schemas/users');
let roleModel = require('./schemas/roles');

async function fixAdminRole() {
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-S4');

    // Tạo role nếu chưa có
    let role = await roleModel.findOne({ name: 'Quản trị viên' });
    if (!role) {
        role = await roleModel.create({ name: 'Quản trị viên', description: 'Toàn quyền' });
        console.log('Đã tạo role Quản trị viên:', role._id);
    } else {
        console.log('Role đã tồn tại:', role._id);
    }

    // Gán role cho admin
    let user = await userModel.findOne({ username: 'admin' });
    if (!user) {
        console.log('Không tìm thấy user admin');
        process.exit();
    }

    user.role = role._id;
    await user.save();
    console.log('Đã gán role Quản trị viên cho admin!');
    process.exit();
}

fixAdminRole();
