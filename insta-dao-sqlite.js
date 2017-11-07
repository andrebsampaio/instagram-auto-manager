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

  getFollowersWithTimeInterval(start,end,callback){
    var realEnd = end ? end : "strftime('%s','now')";
    var query = `SELECT * FROM follower WHERE ${start} - created > 0 AND created - ${realEnd} < 0`;
    var logger = this.log;
    db.each(query,[], (err, result) => {
      if (err) {
        return logger.info(err.message);
      }

      callback(result);

   });

   db.close();
  }

  removeFollower(accountId){
    var query = `DELETE FROM follower WHERE account_id = "${accountId}"`
    var logger = this.log;  
    db.run(query,[], function(err){
      if (err) {
        return logger.info(err.message);
      }
      logger.info(`Removed follower with Id ${accountId}`);
    });
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