var Client = require('instagram-private-api').V1;
var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('fs');

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
                            timestamp : medium.params.deviceTimestamp,
                            url : _.first(medium.params.images).url
                        }
                    });
                    return images;
                });
            });
    }
};