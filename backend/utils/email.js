const nodemailer = require("nodemailer");
require("dotenv").config();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"CodeCollab" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Reset - CodeCollab",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #3b82f6; text-align: center;">CodeCollab</h2>
        <h3>Password Reset Request</h3>
        <p>Hello,</p>
        <p>You requested a password reset for your CodeCollab account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          The CodeCollab Team
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"CodeCollab" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to CodeCollab!",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #3b82f6; text-align: center;">CodeCollab</h2>
        <h3>Welcome to CodeCollab, ${name}!</h3>
        <p>We're excited to have you join our collaborative coding platform.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4>What you can do with CodeCollab:</h4>
          <ul style="line-height: 1.6;">
            <li>Create and join coding rooms</li>
            <li>Collaborate on code in real-time</li>
            <li>Have video calls with teachers/students</li>
            <li>Share your screen for better learning</li>
            <li>Chat and react during sessions</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          The CodeCollab Team
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
