import transporter from "../config/mail.js";

export const sendEmail = async ({
    to,
    bcc,
    subject,
    text,
    html
}) => {

    const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        bcc,
        subject,
        text,
        html
    };

    return await transporter.sendMail(mailOptions);
};