CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_role` text NOT NULL,
	`category` text NOT NULL,
	`push_enabled` integer DEFAULT true NOT NULL,
	`in_app_enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_prefs_user_category_unique` ON `notification_preferences` (`user_id`,`user_role`,`category`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_role` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh_key` text NOT NULL,
	`auth_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_user_endpoint_unique` ON `push_subscriptions` (`user_id`,`user_role`,`endpoint`);--> statement-breakpoint
CREATE TABLE `teacher_subjects` (
	`teacher_id` text NOT NULL,
	`subject` text NOT NULL,
	PRIMARY KEY(`teacher_id`, `subject`),
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
