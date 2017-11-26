var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
});

module.exports = class emailUtil {
    constructor(log){
        this.log = log;
    }

    sendEmail(subject, text, destinationEmail, callback){
        var logger = this.log;
        var mailOptions = {
            from: process.env.EMAIL,
            to: destinationEmail,
            subject: subject,
            text: text
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              logger.error(error);
            } else {
              logger.info('Email sent: ' + info.response);
              callback(info);
            }
        });
    }
}
