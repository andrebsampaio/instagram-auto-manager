var InstagramAPI = require('./instagram-api');
var async = require('async');
var IOUtils = require('./io-util');
const SimpleNodeLogger = require('simple-node-logger'),
opts = {
    logFilePath:'mylogfile.log',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
},
log = SimpleNodeLogger.createSimpleLogger( opts );
var args = process.argv.slice(2);
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
    var nowInSeconds = new Date().getTime()/1000;
    for (url of urls) {
        var urlTimestampInSeconds = url.timestamp;
        if (url.timestamp.toString().length > 10){
            urlTimestampInSeconds = url.timestamp/1000;
        }
        if (url.url !== undefined && nowInSeconds - urlTimestampInSeconds  < oldAs) {
            return url.url;
        }
    }
    throw new Error('No URLs satisfy');
}

var uploadImageFromUser = function(username, caption, oldAs, callback) {
    log.info("Checking " + username + " feed");
    return api.getImagesFromUser(username)
        .then(function(urls) {
            IOUtils.makeDir(imgFolder);
            IOUtils.download(getValidURI(urls, oldAs), imgFolder + username + imgExtension, function(filename) {
                return function() {
                    log.info("Now uploading " + username);
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
                log.info(e.message);
                callback(null);
            });
        });
    });
}

runInstagrammersDBUpload(args);