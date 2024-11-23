const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
});

const sendVerificationMail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        // text: text,
        html: html
    }

    return transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to mail id: ${to}`);
        }
    })
}

module.exports = { sendVerificationMail };