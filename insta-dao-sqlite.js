const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./database/insta-auto', (err) => {
    if (err) {
      console.error(err.message);
    }
});

module.exports = class InstaDaoSqlite {

  constructor(log){
    this.log = log;
  }

  getInstagrammersByTopic(topic){
    //TODO
  }

  removeFollowersWithTimeInterval(start, end){
    var realEnd = end ? end : "strftime('%s','now')";
    var query = `DELETE FROM follower WHERE ${start} - created > 0 AND created - ${realEnd} < 0`
    var logger = this.log;
    db.run(query,[], function(err){
      if (err) {
        return logger.info(err.message);
      }
      logger.info(`Followers between ${start} and ${realEnd} removed`);
    });
    db.close();
  }

  saveFollowers(accountIdsWithHashtag){
    var query = 'INSERT INTO follower(created, account_id, hashtag) VALUES';
    accountIdsWithHashtag.forEach(function(item,index){
      var separator = index != accountIdsWithHashtag.length - 1 ? "," : "";
      query += ` (strftime('%s','now'), ${item.accountId},"${item.hashtag}")${separator}`;
    });

    var logger = this.log;
    db.run(query,[], function(err) {
    if (err) {
      return logger.info(err.message);
    }

    logger.info(`Saved ${accountIdsWithHashtag.length} followers`);
  });
 
  db.close();
  }
}