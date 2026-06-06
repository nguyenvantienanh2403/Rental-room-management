import nodemailer from "nodemailer";
import env from "../config/env.config.js";

// ---------------------------------------------------------------------------
// Singleton transporter — created once and reused for all email sends.
// Creating a new SMTP connection per email is expensive and unnecessary.
// ---------------------------------------------------------------------------
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.email.username,
        pass: env.email.password,
      },
    });
  }
  return _transporter;
};

/**
 * Sends an email via the configured SMTP transporter.
 * @param {{ email: string, subject: string, message: string }} options
 */
const sendEmail = async (options) => {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"Hệ thống Quản lý Trọ" <${env.email.username}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
