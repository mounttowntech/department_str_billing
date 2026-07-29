const transporter = require("../config/mailer");

const sendMail = async ({ to, subject, html, text = "" }) => {
  try {
    const info = await transporter.sendMail({
      from: `WonderBill <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email Sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
};

module.exports = sendMail;