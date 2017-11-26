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
    var query = `SELECT * 
    FROM follower 
    WHERE  created > ${start} AND ${realEnd} > created 
    ORDER BY created ASC`;
    var logger = this.log;
    db.each(query,[], (err, result) => {
      if (err) {
        return logger.info(err.message);
      }

      callback(result);

   });
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

  saveFollowerCount(count){
    var query = `INSERT INTO follower_status(created,count) VALUES (strftime('%s','now'), ${count})`;
    var logger = this.log;
    db.run(query,[],function(err){
      if (err) {
        return logger.info(err.message);
      }
  
      logger.info(`Registered ${count} followers`);
    });

    db.close();
  }

  getFollowerCountWithInterval(start,end, callback) {
    var query = `SELECT * 
    FROM follower_status 
    WHERE  created > ${start} AND ${end} > created 
    ORDER BY created DESC`;

    var logger = this.log;

    db.get(query, [], callback);
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
 
  }

  closeDB(){
    db.close();
  }
}