var InstagramAPI = require('./instagram-api');
var async = require('async');
var IOUtils = require('./io-util');
var captionAPI = require('./caption-api');
const SimpleNodeLogger = require('simple-node-logger'),
opts = {
    logFilePath:'mylogfile.log',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
},
log = SimpleNodeLogger.createSimpleLogger( opts );
var argv = require('minimist')(process.argv.slice(2));
var imgExtension = '.jpg';
var imgFolder = './tmp/';
var dbPath = 'instagrammers-db';
var instaLocalDB = IOUtils.readJSONfromFile(dbPath);
var ONE_DAY = 86400;

var api = new InstagramAPI(argv.u, argv.p, __dirname + '/cookies/');

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
            return url;
        }
    }
    throw new Error('No URLs satisfy');
}

var uploadImageFromUser = function(username, caption, oldAs, callback) {
    log.info("Checking " + username + " feed");
    return api.getImagesFromUser(username)
        .then(function(urls) {
            IOUtils.makeDir(imgFolder);
            var selectedUri = getValidURI(urls, oldAs);
            IOUtils.download(selectedUri.url, imgFolder + username + imgExtension, function(filename) {
                return function() {
                    log.info("Now uploading " + username);
                    api.uploadImage(filename, caption, callback);
                }
            });
        });
}

var photoHashtags = "#agameoftones #ig_masterpiece #ig_exquisite #ig_shotz #global_hotshotz #superhubs #main_vision #master_shots #exclusive_shots #hubs_united #worldshotz #theworldshotz #pixel_ig #photographyislifee #photographyislife #photographysouls #photographyeveryday #photographylover #worldbestgram #iglobal_photographers #ig_great_pics #ig_myshot #shotwithlove #justgoshoot #xposuremag #icatching #collectivelycreate #wanderlust #heatercentral #highsnobiety"

var hashtags = "#photography #love #instagood #follow #followme #followback #instafollow #photo #photos #pic #pics #picture #pictures #snapshot #art #beautiful #follow4follow #instagood #picoftheday #photooftheday #color #all_shots #exposure #composition #focus #capture #moment"

var runInstagrammersDBUpload = function (topic){
    async.eachSeries(instaLocalDB[topic], function iteratee(item, callback) {
        var quote = captionAPI.getQuote().then(function(quote){
            var formattedCaption = '"' + quote + '"\n' + "Photo by: " + item.username + "\n" + photoHashtags;
            uploadImageFromUser(item.username, formattedCaption, ONE_DAY, function(imagePath, result) {
                IOUtils.deleteFile(imagePath);
                callback(null);
            }).catch(function(e) {
                log.info(e.message);
                callback(null);
            });
        })
    });
}

var runAutoLike = function(pageSize, interval){
    var hashtagsSplit = hashtags.split(" ");
    var hashtag = hashtagsSplit[Math.floor(Math.random() * hashtagsSplit.length)].substr(1);
    log.info("Liking hashtag " + hashtag);
    api.getImagesByHashtag(hashtag,pageSize)
        .then(function(ids){
            async.eachSeries(ids.slice(0,pageSize), function iteratee(item,callback){
                setTimeout(function(){
                    log.info("Liking image with id " + item);
                    api.likeImage(item);
                    callback(null);
                },interval)
            });
        });
}

if (argv.upload){
    runInstagrammersDBUpload(argv.t);
} else if (argv.like){
    runAutoLike(argv.n,argv.i);
} else {
    console.log("Choose an action");
}


