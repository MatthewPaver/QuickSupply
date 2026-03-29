CREATE TABLE `compliance_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`status` text DEFAULT 'pending_verification' NOT NULL,
	`expiry_date` text,
	`rejection_reason` text,
	`uploaded_at` integer NOT NULL,
	`verified_at` integer,
	`verified_by` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `compliance_documents_teacher_id_idx` ON `compliance_documents` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `compliance_documents_status_idx` ON `compliance_documents` (`status`);--> statement-breakpoint
CREATE INDEX `compliance_documents_expiry_date_idx` ON `compliance_documents` (`expiry_date`);