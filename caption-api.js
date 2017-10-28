var request = require('request-promise');

module.exports = {
    getQuote: function(){
        return request.post("https://api.forismatic.com/api/1.0/?method=getQuote&format=json&key=&lang=en")
        .then(function(result){
            var cleanJson = result.replace(/\\/g, '');          
            return JSON.parse(cleanJson).quoteText;
        })
    }
}