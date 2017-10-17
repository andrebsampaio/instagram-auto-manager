var InstagramAPI = require('./instagram-api');
var async = require('async');
var IOUtils = require('./io-util');
var imgExtension = '.jpg';
var imgFolder = './tmp/';
var dbPath = 'instagrammers-db';
var instaLocalDB = IOUtils.readJSONfromFile(dbPath);
var ONE_DAY = 86400;

var api = new InstagramAPI('zixam1805', 'password123456789', __dirname + '/cookies/');

var getValidURI = function(urls, oldAs) {
    if (urls === undefined || !urls.length) {
        throw new Error('URLs is empty');
    }
    var nowInSeconds = new Date().getTime()/1000
    for (url of urls) {
        if (url.url !== undefined && nowInSeconds - url.timestamp  < oldAs) {
            return url.url;
        }
    }
    throw new Error('No URLs satisfy');
}

var uploadImageFromUser = function(username, caption, oldAs, callback) {
    console.log("Now uploading " + username);
    return api.getImagesFromUser(username)
        .then(function(urls) {
            IOUtils.makeDir(imgFolder);
            IOUtils.download(getValidURI(urls, oldAs), imgFolder + username + imgExtension, function(filename) {
                return function() {
                    api.uploadImage(filename, caption, callback);
                }
            });
        });
}

var runInstagrammersDBUpload = function (topic){
    async.eachSeries(instaLocalDB[topic], function iteratee(item, callback) {
        api.getHashtagsForWord(topic).then(function(hashtags){
            var formattedCaption = "Photo by: " + item.username + "\n" + hashtags.join(" ");
            uploadImageFromUser(item.username, formattedCaption, ONE_DAY, function(imagePath, result) {
                IOUtils.deleteFile(imagePath);
                callback(null);
            }).catch(function(e) {
                console.log(e.message);
                callback(null);
            });
        });
    });
}

runInstagrammersDBUpload('photography');