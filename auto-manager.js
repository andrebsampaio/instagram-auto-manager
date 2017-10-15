var InstagramAPI = require('./instagram-api');
var fs = require('fs');
var async = require('async');
var request = require('request');
var imgExtension = '.jpg';
var imgFolder = './tmp/';
var dbPath = 'instagrammers-db';
var instaLocalDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'))[0];

var api = new InstagramAPI('zixam1805', 'password123456789', __dirname + '/cookies/');

var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback(filename));
    });
};

var deleteFile = function(filename) {
    fs.unlink(filename, function(err) {
        if (err && err.code == 'ENOENT') {
            // file doens't exist
            console.info("File doesn't exist, won't remove it.");
        } else if (err) {
            // other errors, e.g. maybe we don't have enough permission
            console.error("Error occurred while trying to remove file");
        }
    });
}

var getValidURI = function(urls) {
    if (urls === undefined || !urls.length) {
        throw new Error('URLs is empty');
    }
    for (url of urls) {
        if (url !== undefined) {
            return url;
        }
    }
}

var uploadImageFromUser = function(username, caption, callback) {
    console.log("Now uploading " + username);
    return api.getImagesFromUser(username)
        .then(function(urls) {
            if (!fs.existsSync(imgFolder)) {
                fs.mkdirSync(imgFolder);
            }
            download(getValidURI(urls), imgFolder + username + imgExtension, function(filename) {
                return function() {
                    api.uploadImage(filename, caption, callback);
                }
            });
        });
}

async.eachSeries(instaLocalDB.photography, function iteratee(item, callback) {
    uploadImageFromUser(item.username, "Photo by: " + item.username, function(imagePath, result) {
        deleteFile(imagePath);
        callback(null);
    }).catch(function(e) {
        console.log(e);
        callback(null);
    });
});