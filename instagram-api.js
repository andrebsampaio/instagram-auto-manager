var Client = require('instagram-private-api').V1;
var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');
var request = require('request-promise');

module.exports = class InstagramAPI {

    constructor(clientName, password, storagePath) {
        this.device = new Client.Device(clientName);
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath);
        }
        this.storage = new Client.CookieFileStorage(storagePath + clientName);
        this.clientName = clientName;
        this.password = password;
    }

    getSession() {
        return Client.Session.create(this.device, this.storage, this.clientName, this.password);
    }

    likeImage(mediaId){
        return this.getSession().then(function(session){
            Client.Like.create(session, mediaId);
        });
    }

    uploadImage(imagePath, imageCaption, callback) {
        this.getSession().then(function(session) {
            Client.Upload.photo(session, imagePath)
                .then(function(upload) {
                    Client.Media.configurePhoto(session, upload.params.uploadId, imageCaption)
                        .then(function(result) {
                            callback(imagePath, result);
                        });
                });
        });
    }

    findAccount(username) {
        return this.getSession().then(function(session) {
            return Client.Account.searchForUser(session, username)
        });
    }

    getHashtagsForWord(word){
        var url = "https://seekmetrics.com/api/hashtag-generator/" + word;
        return request(url).then(function(body){
            var jsonObject = JSON.parse(body);
            var hashtags = _.map(jsonObject, function(hashtag){
                return "#" + hashtag.name
            });
            return hashtags;
        });
    }
    
    getImagesByHashtag(hashtag, pageSize){
        return this.getSession()
            .then(function(session){
                var tagged = new Client.Feed.TaggedMedia(session,hashtag,pageSize);
                return tagged.get().then(function(results){
                    // result should be Media[][]
                    var media = _.flatten(results);
                    var ids = _.map(media, function(medium) {
                        return medium.id
                    });
                    return ids;
                });    
            })
           
    }

    getImagesFromUser(username) {
        var api = this;
        return this.getSession()
            .then(function(session) {
                return [session, api.findAccount(username)];
            })
            .spread(function(session, account) {
                var feed = new Client.Feed.UserMedia(session, account.id);

                return feed.get().then(function(results) {
                    // result should be Media[][]
                    var media = _.flatten(results);
                    var images = _.map(media, function(medium) {
                        return {
                            location : medium.params.location,
                            timestamp : medium.params.deviceTimestamp,
                            url : _.first(medium.params.images).url
                        }
                    });
                    return images;
                });
            });
    }
};