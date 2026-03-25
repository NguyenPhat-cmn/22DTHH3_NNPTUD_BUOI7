let nodemailer = require('nodemailer');

// Cấu hình email - thay bằng thông tin thực của bạn
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com',       // <-- thay email của bạn
        pass: 'your_app_password'            // <-- thay App Password Gmail
    }
});

module.exports = {
    sendResetPasswordEmail: async function (toEmail, resetToken) {
        let mailOptions = {
            from: 'your_email@gmail.com',
            to: toEmail,
            subject: 'Đặt lại mật khẩu',
            html: `
                <h3>Yêu cầu đặt lại mật khẩu</h3>
                <p>Mã OTP của bạn là: <b>${resetToken}</b></p>
                <p>Mã có hiệu lực trong 10 phút.</p>
                <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            `
        };
        await transporter.sendMail(mailOptions);
    }
};
