CREATE TABLE `timesheets` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`arrival_time` text NOT NULL,
	`departure_time` text NOT NULL,
	`break_minutes` integer DEFAULT 0 NOT NULL,
	`total_hours` real NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`submitted_at` integer NOT NULL,
	`approved_at` integer,
	`dispute_reason` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `timesheets_booking_id_idx` ON `timesheets` (`booking_id`);--> statement-breakpoint
CREATE INDEX `timesheets_teacher_id_idx` ON `timesheets` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `timesheets_status_idx` ON `timesheets` (`status`);