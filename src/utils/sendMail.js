const nodemailer = require("nodemailer");
module.exports = async ({ to, subject, html }) => {
  const t = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
  return t.sendMail({
    from: `Billing <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};
