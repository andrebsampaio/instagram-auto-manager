BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS `instagrammer` (
	`username`	TEXT,
	`topic`	TEXT,
	PRIMARY KEY(`username`)
);
CREATE TABLE IF NOT EXISTS `follower_status` (
	`created`	INTEGER,
	`count`	INTEGER
);
INSERT INTO `follower_status` VALUES (1511643636,24);
CREATE TABLE IF NOT EXISTS `follower` (
	`created`	INTEGER,
	`account_id`	TEXT,
	`hashtag`	TEXT
);
COMMIT;
