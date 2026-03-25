let mongoose = require('mongoose');
let userModel = require('./schemas/users');

async function resetPassword() {
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-S4');
    
    let user = await userModel.findOne({ username: 'admin' });
    if (!user) {
        console.log('Không tìm thấy user admin');
        process.exit();
    }
    
    user.password = 'Admin@1234';
    await user.save(); // schema tự hash
    
    console.log('Reset mật khẩu thành công!');
    console.log('Username: admin');
    console.log('Password: Admin@1234');
    process.exit();
}

resetPassword();
