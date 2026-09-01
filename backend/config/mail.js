import nodemailer from "nodemailer";



const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    }
});


export default transporter;