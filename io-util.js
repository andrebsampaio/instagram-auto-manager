var request = require('request');
var fs = require('fs');

module.exports = {
    download : function(uri, filename, callback) {
        request.head(uri, function(err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback(filename));
        });
    },
    
    makeDir : function(path){
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    },

    deleteFile : function(filename) {
        fs.unlink(filename, function(err) {
            if (err && err.code == 'ENOENT') {
                // file doens't exist
                console.info("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            }
        });
    },

    readJSONfromFile: function(filePath){
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))[0];
    }
}

