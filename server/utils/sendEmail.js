const nodemailer = require('nodemailer');

const getRequiredSmtpConfig = () => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const err = new Error(`Email service is not configured. Missing: ${missing.join(', ')}`);
    err.statusCode = 503;
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
};

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport(getRequiredSmtpConfig());

  const message = {
    from: `${process.env.FROM_NAME || 'Exam Portal'} <${process.env.SMTP_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log(`Email sent: %s`, info.messageId);
    return info;
  } catch (error) {
    error.statusCode = 503;
    error.code = error.code === 'EAUTH' ? 'EMAIL_AUTH_FAILED' : 'EMAIL_DELIVERY_FAILED';
    throw error;
  }
};

module.exports = sendEmail;
