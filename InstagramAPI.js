class InstagramAPI {

    constructor(clientName, password, storagePath) {
        this.Client = require('instagram-private-api').V1;
        this.device = new this.Client.Device(clientName);
        this.storage = new this.Client.CookieFileStorage(storagePath);
        this.clientName = clientName;
        this.password = password;
    }

    getSession() {
        return this.Client.Session.create(this.device, this.storage, this.clientName, this.password)
            .then(function(session) {
                return session;
            });
    }

    uploadImage(imagePath, imageCaption) {
    	var client = this.Client;
        this.getSession().then(function(session) {
            client.Upload.photo(session, imagePath)
                .then(function(upload) {
                    console.log(upload.params.uploadId);
                    return client.Media.configurePhoto(session, upload.params.uploadId, imageCaption);
                });
        });
    }
}

new InstagramAPI('zixam1805', 'password123456789', __dirname + '\cookies\zixam1805').uploadImage('novalincsbg.jpg', 'fuck yeah');