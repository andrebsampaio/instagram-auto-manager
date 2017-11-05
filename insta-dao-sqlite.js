const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./database/insta-auto', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
});

module.exports = {
  getInstagrammersByTopic: function(topic){
    //TODO
  },

  removeFollowersWithTimeInterval: function(start, end){
    var realEnd = end ? end : "strftime('%s','now')";
    var query = `DELETE FROM follower WHERE ${start} - created > 0 AND created - ${realEnd} < 0` 
    db.run(query,[], function(err){
      if (err) {
        return console.log(err.message);
      }
      console.log(`Followers between ${start} and ${realEnd} removed`);
    });

    db.close();
  },

  saveFollowers: function(accountIdsWithHashtag){
    var query = 'INSERT INTO follower(created, account_id, hashtag) VALUES';
    accountIdsWithHashtag.forEach(function(item,index){
      var separator = index != accountIdsWithHashtag.length - 1 ? "," : "";
      query += ` (strftime('%s','now'), ${item.accountId},"${item.hashtag}")${separator}`;
    });

    db.run(query,[], function(err) {
    if (err) {
      return console.log(err.message);
    }

    console.log(`Followers saved to db`);
  });
 
  db.close();
  }
}