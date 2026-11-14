CREATE TABLE `study_chat_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `study_group_members` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`invited_by` text NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `study_chat_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `group_members_user` ON `study_group_members` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `group_members_group` ON `study_group_members` (`group_id`,`status`);--> statement-breakpoint
CREATE TABLE `study_group_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`nonce` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `study_chat_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `group_messages_group` ON `study_group_messages` (`group_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `group_messages_nonce` ON `study_group_messages` (`sender_id`,`nonce`);--> statement-breakpoint
ALTER TABLE `study_accounts` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `study_accounts` ADD `share_phone` integer DEFAULT 0 NOT NULL;