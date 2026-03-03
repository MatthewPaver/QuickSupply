-- Password reset tokens are now stored as SHA-256 hashes instead of raw tokens.
-- Existing tokens are intentionally invalidated during this migration.
DROP TABLE IF EXISTS `password_reset_tokens`;
--> statement-breakpoint

CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique`
	ON `password_reset_tokens` (`token_hash`);
--> statement-breakpoint

CREATE INDEX `password_reset_tokens_user_role_idx`
	ON `password_reset_tokens` (`user_id`, `role`);
--> statement-breakpoint

CREATE INDEX `password_reset_tokens_expires_at_idx`
	ON `password_reset_tokens` (`expires_at`);
--> statement-breakpoint

CREATE INDEX `notification_log_read_created_at_idx`
	ON `notification_log` (`read`, `created_at`);
