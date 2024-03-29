var InstagramAPI = require('./instagram-api');
var async = require('async');
var IOUtils = require('./io-util');
var captionAPI = require('./caption-api');
var emailUtil = require('./email-util');
var InstaDaoSqlite = require('./insta-dao-sqlite');
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
var MIN_INTERVAL = 8000;
var ONE_DAY = 86400;
var ONE_HOUR = 3600;
var LIKE = "LIKE";
var FOLLOW = "FOLLOW";

var emailUtil = new emailUtil(log);
var api = new InstagramAPI(argv.u, argv.p, __dirname + '/cookies/');
var instaDao = new InstaDaoSqlite(log);

var getValidURI = function(urls, oldAs) {
    if (urls === undefined || !urls.length) {
        throw new Error('URLs is empty');
    }
    for (url of urls) {
        var urlTimestampInSeconds = url.timestamp;
        if (url.timestamp.toString().length > 10){
            urlTimestampInSeconds = url.timestamp/1000;
        }
        if (url.url !== undefined && nowInSeconds() - urlTimestampInSeconds  < oldAs) {
            return url;
        }
    }
    throw new Error('No URLs satisfy');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nowInSeconds(){
    return new Date().getTime()/1000;
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

var runAutoAction = function(pageSize, interval, action){
    var hashtagsSplit = hashtags.split(" ");
    var hashtag = hashtagsSplit[Math.floor(Math.random() * hashtagsSplit.length)].substr(1);
    log.info(action + " hashtag " + hashtag);
    api.getImagesByHashtag(hashtag,pageSize)
        .then(function(images){
            var addToDB = [];
            async.eachSeries(images.slice(0,pageSize), function iteratee(item,callback){
                setTimeout(function(){
                    var id;
                    switch(action){
                        case LIKE:
                            api.likeImage(item.id);
                            id = item.id;
                            break;
                        case FOLLOW:
                            api.followUser(item.account.id);
                            addToDB.push({
                                accountId: item.account.id,
                                hashtag: hashtag
                            });
                            id = item.account.id;
                            break;
                        default:
                            log.info("Unrecognized Action");
                            return;
                    }
                    log.info(action + " with id " + id);
                    
                    callback(null);
                },getRandomInt(MIN_INTERVAL,interval))
            }, function(err,result){
                if (action == FOLLOW){
                    instaDao.saveFollowers(addToDB);
                }
            });
        });
}

var unfollowAction = function(){
    var start = nowInSeconds() - (ONE_DAY) * argv.d;
    var end = nowInSeconds()
    var count = 1;
    instaDao.getFollowersWithTimeInterval(start,end,function(follower){
        if(count - 1 == argv.n) return;
        setTimeout(function(){
            api.unfollowUser(follower.account_id).then(function(result){
                instaDao.removeFollower(follower.account_id);
            });
        },getRandomInt(MIN_INTERVAL * count,argv.i));
        count++;        
    });
}

var checkFollowers = function(expectedPerHour){
    api.getFollowing(argv.u).then(function(result){
        var currentCount = result.length;
        instaDao.saveFollowerCount(currentCount);

        instaDao.getFollowerCountWithInterval(nowInSeconds - argv.i * 60, nowInSeconds(), function(err,row){
            if (err) {
                return log.info(err.message);
            }

            if (row){
                var nextCount = row.count + expectedPerHour/2;
                var condition = expectedPerHour < 0 ? currentCount >= nextCount  : currentCount <= nextCount;
                if (condition){
                    emailUtil.sendEmail(`${argv.u} - There's a problem with FOLLOWING`,
                        `Current Count: ${currentCount}\n 
                        Last Count: ${row.count}`,
                        process.env.DESTINATION_EMAIL, function(info){
                            instaDao.closeDB();
                        }
                    );
                }
            }

        });
        
    });
}

if (!argv.i){
    argv.i = 12000;
} else if (!argv.n){
    argv.n = 5;
} else if (!argv.d) {
    argv.d = 2;
}

if (argv.upload){
    runInstagrammersDBUpload(argv.t);
} else if (argv.like){
    runAutoAction(argv.n,argv.i, LIKE);
} else if (argv.follow){
    runAutoAction(argv.n,argv.i, FOLLOW);    
} else if (argv.unfollow){
    unfollowAction();
} else if (argv.followerscheck) {
    checkFollowers(argv.e, argv.i);
} else {
    log.info("Choose an action");
}

