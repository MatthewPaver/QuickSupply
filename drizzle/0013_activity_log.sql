CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_log_actor_id_idx` ON `activity_log` (`actor_id`);
--> statement-breakpoint
CREATE INDEX `activity_log_action_idx` ON `activity_log` (`action`);
--> statement-breakpoint
CREATE INDEX `activity_log_created_at_idx` ON `activity_log` (`created_at`);
