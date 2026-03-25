var express = require('express');
var router = express.Router();
let bcrypt = require('bcrypt');
let userController = require('../controllers/users');
let userModel = require('../schemas/users');
let { generateToken, authentication, authorization } = require('../utils/authHandler');
let { sendResetPasswordEmail } = require('../utils/mailHandler');

// ==================== REGISTER ====================
router.post('/register', async function (req, res) {
    try {
        let { username, password, email } = req.body;
        if (!username || !password || !email)
            return res.status(400).send({ message: 'Thiếu thông tin bắt buộc' });

        // Role mặc định cho user thường - thay bằng _id role "user" trong DB của bạn
        let defaultRoleId = '69b0ddec842e41e8160132b8';
        let newUser = await userController.CreateAnUser(username, password, email, defaultRoleId);
        res.status(201).send({ message: 'Đăng ký thành công', userId: newUser._id });
    } catch (error) {
        if (error.code === 11000) return res.status(400).send({ message: 'Username hoặc email đã tồn tại' });
        res.status(500).send({ message: error.message });
    }
});

// ==================== LOGIN ====================
router.post('/login', async function (req, res) {
    try {
        let { username, password } = req.body;
        let user = await userModel.findOne({ username, isDeleted: false }).populate('role');

        if (!user) return res.status(401).send({ message: 'Thông tin đăng nhập sai' });

        if (user.lockTime && user.lockTime > Date.now())
            return res.status(403).send({ message: 'Tài khoản đang bị khóa, thử lại sau' });

        if (!bcrypt.compareSync(password, user.password)) {
            user.loginCount++;
            if (user.loginCount >= 3) {
                user.loginCount = 0;
                user.lockTime = new Date(Date.now() + 3600 * 1000); // khóa 1 giờ
            }
            await user.save();
            return res.status(401).send({ message: 'Thông tin đăng nhập sai' });
        }

        // Đăng nhập thành công
        user.loginCount = 0;
        user.lockTime = null;
        await user.save();

        let token = generateToken({
            id: user._id,
            username: user.username,
            roleName: user.role?.name
        });

        res.send({ message: 'Đăng nhập thành công', token });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ==================== GET INFO (authentication required) ====================
router.get('/me', authentication, async function (req, res) {
    try {
        let user = await userModel
            .findById(req.user.id)
            .select('-password -resetToken -resetTokenExpiry')
            .populate('role', 'name');

        if (!user || user.isDeleted) return res.status(404).send({ message: 'Không tìm thấy user' });
        res.send(user);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ==================== CHANGE PASSWORD (authentication required) ====================
router.put('/change-password', authentication, async function (req, res) {
    try {
        let { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            return res.status(400).send({ message: 'Thiếu mật khẩu cũ hoặc mới' });

        // Validate newPassword: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!strongPassword.test(newPassword)) {
            return res.status(400).send({
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }

        let user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).send({ message: 'Không tìm thấy user' });

        if (!bcrypt.compareSync(oldPassword, user.password))
            return res.status(400).send({ message: 'Mật khẩu cũ không đúng' });

        if (oldPassword === newPassword)
            return res.status(400).send({ message: 'Mật khẩu mới không được trùng mật khẩu cũ' });

        user.password = newPassword;
        await user.save();
        res.send({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ==================== FORGOT PASSWORD - Gửi OTP ====================
router.post('/forgot-password', async function (req, res) {
    try {
        let { email } = req.body;
        let user = await userModel.findOne({ email, isDeleted: false });
        // Luôn trả về thông báo chung để tránh lộ email
        if (!user) return res.send({ message: 'Nếu email tồn tại, OTP đã được gửi' });

        let otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
        user.resetToken = otp;
        user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        await user.save();

        await sendResetPasswordEmail(email, otp);
        res.send({ message: 'Nếu email tồn tại, OTP đã được gửi' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ==================== RESET PASSWORD - Dùng OTP ====================
router.post('/reset-password', async function (req, res) {
    try {
        let { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).send({ message: 'Thiếu thông tin' });

        let user = await userModel.findOne({ email, isDeleted: false });
        if (!user || user.resetToken !== otp || user.resetTokenExpiry < Date.now())
            return res.status(400).send({ message: 'OTP không hợp lệ hoặc đã hết hạn' });

        user.password = newPassword; // schema pre('save') sẽ tự hash
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        res.send({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ==================== VÍ DỤ AUTHORIZATION ====================
// Chỉ admin mới truy cập được
router.get('/admin-only', authentication, authorization('admin'), function (req, res) {
    res.send({ message: `Xin chào admin ${req.user.username}` });
});

module.exports = router;
