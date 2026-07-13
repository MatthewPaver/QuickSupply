ALTER TABLE `teachers` ADD `dbs_status` text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE `teachers` ADD `dbs_expiry` text;
--> statement-breakpoint
ALTER TABLE `teachers` ADD `right_to_work` text DEFAULT 'not_checked' NOT NULL;
