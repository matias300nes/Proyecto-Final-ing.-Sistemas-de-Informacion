const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.host.com",
    port: 465,
    secure: true,
    auth: {
        user: "test@dominio.com",
        pass: "password",
    },
    watchHtml: true,
});

module.exports = transporter;