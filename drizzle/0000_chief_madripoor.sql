CREATE TABLE `agent_teacher_assignments` (
	`agent_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	PRIMARY KEY(`agent_id`, `teacher_id`),
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assignment_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`cover_request_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`offered_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response_at` integer,
	`offer_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cover_request_id`) REFERENCES `cover_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`cover_request_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`confirmed_at` integer NOT NULL,
	`cancelled_at` integer,
	`cancelled_by` text,
	`cancellation_reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cover_request_id`) REFERENCES `cover_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cover_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`date` text NOT NULL,
	`role_needed` text NOT NULL,
	`subject` text,
	`key_stage` text,
	`start_time` text NOT NULL,
	`end_time` text DEFAULT '15:30' NOT NULL,
	`notes` text,
	`preferred_teacher_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_emergency` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`preferred_teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_type` text NOT NULL,
	`recipient_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`related_entity_type` text,
	`related_entity_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `school_teacher_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`postcode` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `teacher_availability` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`date` text,
	`day_of_week` integer,
	`is_available` integer NOT NULL,
	`is_recurring` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teacher_blacklisted_schools` (
	`teacher_id` text NOT NULL,
	`school_id` text NOT NULL,
	`reason` text,
	PRIMARY KEY(`teacher_id`, `school_id`),
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`password_hash` text NOT NULL,
	`postcode` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`can_drive` integer DEFAULT false NOT NULL,
	`max_distance_miles` real DEFAULT 10 NOT NULL,
	`role_type` text DEFAULT 'teacher' NOT NULL,
	`emergency_available` integer DEFAULT false NOT NULL,
	`contact_night_before_only` integer DEFAULT false NOT NULL,
	`agency_rating` real DEFAULT 3 NOT NULL,
	`compliance_status` text DEFAULT 'pending' NOT NULL,
	`compliance_notes` text,
	`long_term_willing` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
