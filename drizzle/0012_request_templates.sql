CREATE TABLE `request_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`role_needed` text NOT NULL,
	`subject` text,
	`key_stage` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
