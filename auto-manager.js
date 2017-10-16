var InstagramAPI = require('./instagram-api');
var async = require('async');
var IOUtils = require('./io-util');
var imgExtension = '.jpg';
var imgFolder = './tmp/';
var dbPath = 'instagrammers-db';
var instaLocalDB = IOUtils.readJSONfromFile(dbPath);

var api = new InstagramAPI('zixam1805', 'password123456789', __dirname + '/cookies/');

var getValidURI = function(urls, lessThanDaysOld) {
    if (urls === undefined || !urls.length) {
        throw new Error('URLs is empty');
    }
    var nowInSeconds = new Date().getTime()/1000
    for (url of urls) {
        if (url.url !== undefined && nowInSeconds - url.timestamp  < 86400 * lessThanDaysOld) {
            return url.url;
        }
    }
    throw new Error('No URLs satisfy');
}

var uploadImageFromUser = function(username, caption, lessThanDaysOld, callback) {
    console.log("Now uploading " + username);
    return api.getImagesFromUser(username)
        .then(function(urls) {
            IOUtils.makeDir(imgFolder);
            IOUtils.download(getValidURI(urls, lessThanDaysOld), imgFolder + username + imgExtension, function(filename) {
                return function() {
                    api.uploadImage(filename, caption, callback);
                }
            });
        });
}

async.eachSeries(instaLocalDB.photography, function iteratee(item, callback) {
    uploadImageFromUser(item.username, "Photo by: " + item.username, 1, function(imagePath, result) {
        IOUtils.deleteFile(imagePath);
        callback(null);
    }).catch(function(e) {
        console.log(e.message);
        callback(null);
    });
});