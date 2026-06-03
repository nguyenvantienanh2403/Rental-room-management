import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 1. Khởi tạo transporter với cấu hình SMTP (sử dụng Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Định nghĩa các tuỳ chọn email
  const mailOptions = {
    from: `"Hệ thống Quản lý Trọ" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Thực hiện gửi email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
