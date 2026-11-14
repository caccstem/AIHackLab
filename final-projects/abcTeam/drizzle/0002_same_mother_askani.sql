CREATE TABLE `study_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`peer_id` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`peer_id`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `study_friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_a` text NOT NULL,
	`user_b` text NOT NULL,
	`requested_by` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_a`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_b`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `friendships_a` ON `study_friendships` (`user_a`);--> statement-breakpoint
CREATE INDEX `friendships_b` ON `study_friendships` (`user_b`);--> statement-breakpoint
CREATE TABLE `study_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pair_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`body` text NOT NULL,
	`nonce` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `study_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `messages_pair` ON `study_messages` (`pair_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages_sender_nonce` ON `study_messages` (`sender_id`,`nonce`);