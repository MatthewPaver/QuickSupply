ALTER TABLE `teachers` ADD `dbs_status` text DEFAULT 'none' NOT NULL;
ALTER TABLE `teachers` ADD `dbs_expiry` text;
ALTER TABLE `teachers` ADD `right_to_work` text DEFAULT 'not_checked' NOT NULL;
