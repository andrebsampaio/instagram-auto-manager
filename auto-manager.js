var InstagramAPI = require('./instagram-api');
var Client = require('instagram-private-api').V1;

new InstagramAPI('zixam1805', 'password123456789', __dirname + '\cookies\zixam1805').uploadImage('novalincsbg.jpg', 'fuck yeah');