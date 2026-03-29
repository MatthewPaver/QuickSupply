CREATE TABLE `invoice_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`timesheet_id` text NOT NULL,
	`description` text NOT NULL,
	`hours` real NOT NULL,
	`pay_rate` integer NOT NULL,
	`charge_rate` integer NOT NULL,
	`pay_amount` integer NOT NULL,
	`charge_amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`timesheet_id`) REFERENCES `timesheets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invoice_line_items_invoice_id_idx` ON `invoice_line_items` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`total_pay_amount` integer DEFAULT 0 NOT NULL,
	`total_charge_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invoices_school_id_idx` ON `invoices` (`school_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE TABLE `pay_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`role_type` text NOT NULL,
	`school_id` text,
	`pay_rate` integer NOT NULL,
	`charge_rate` integer NOT NULL,
	`effective_from` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pay_rates_role_school_idx` ON `pay_rates` (`role_type`,`school_id`);--> statement-breakpoint
CREATE INDEX `pay_rates_effective_from_idx` ON `pay_rates` (`effective_from`);