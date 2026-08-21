CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text,
	`category` text,
	`rule_type` text NOT NULL,
	`rule_value` integer NOT NULL,
	`xp_reward` integer DEFAULT 0 NOT NULL,
	`coin_reward` integer DEFAULT 0 NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `club_follows` (
	`user_id` text NOT NULL,
	`club_id` text NOT NULL,
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `club_follows_user_club_uq` ON `club_follows` (`user_id`,`club_id`);--> statement-breakpoint
CREATE INDEX `club_follows_club_idx` ON `club_follows` (`club_id`);--> statement-breakpoint
CREATE TABLE `club_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`club_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`motivation` text,
	`applied_at` integer NOT NULL,
	`reviewed_at` integer,
	`reviewed_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_user_club_uq` ON `club_memberships` (`user_id`,`club_id`);--> statement-breakpoint
CREATE INDEX `memberships_club_status_idx` ON `club_memberships` (`club_id`,`status`);--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`direction` text NOT NULL,
	`manager_id` text NOT NULL,
	`logo_url` text,
	`cover_url` text,
	`instagram` text,
	`telegram` text,
	`contacts` text,
	`planned_activity` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`approved_at` integer,
	`approved_by` text,
	FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clubs_slug_unique` ON `clubs` (`slug`);--> statement-breakpoint
CREATE INDEX `clubs_status_idx` ON `clubs` (`status`);--> statement-breakpoint
CREATE INDEX `clubs_direction_idx` ON `clubs` (`direction`);--> statement-breakpoint
CREATE TABLE `coin_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`reason` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`created_at` integer NOT NULL,
	`created_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coins_user_created_idx` ON `coin_transactions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comments_post_idx` ON `comments` (`post_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`organizer_id` text NOT NULL,
	`club_id` text,
	`room_id` text,
	`place_text` text,
	`category` text,
	`cover_url` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`capacity` integer NOT NULL,
	`xp_reward` integer DEFAULT 0 NOT NULL,
	`coin_reward` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`registration_source` text,
	FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_start_idx` ON `events` (`starts_at`);--> statement-breakpoint
CREATE INDEX `events_club_idx` ON `events` (`club_id`);--> statement-breakpoint
CREATE TABLE `levels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_ru` text NOT NULL,
	`name_kk` text,
	`min_xp` integer NOT NULL,
	`rank` integer NOT NULL,
	`icon` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `levels_rank_uq` ON `levels` (`rank`);--> statement-breakpoint
CREATE UNIQUE INDEX `levels_min_xp_uq` ON `levels` (`min_xp`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`action_url` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `post_reactions` (
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_reactions_uq` ON `post_reactions` (`post_id`,`user_id`,`type`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`club_id` text NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`link_url` text,
	`media_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`published_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `posts_club_published_idx` ON `posts` (`club_id`,`published_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`student_id` text,
	`faculty` text,
	`group_name` text,
	`course` integer,
	`avatar_url` text,
	`bio` text,
	`interests_json` text DEFAULT '[]' NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`coin_balance` integer DEFAULT 0 NOT NULL,
	`level_id` integer,
	`is_public` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_student_id_unique` ON `profiles` (`student_id`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`ticket_code` text NOT NULL,
	`status` text DEFAULT 'registered' NOT NULL,
	`source` text DEFAULT 'hub',
	`registered_at` integer NOT NULL,
	`attended_at` integer,
	`scanned_by` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scanned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_ticket_code_unique` ON `registrations` (`ticket_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_event_user_uq` ON `registrations` (`event_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `registrations_event_status_idx` ON `registrations` (`event_id`,`status`);--> statement-breakpoint
CREATE TABLE `reward_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`cost` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`fulfilled_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`cost` integer NOT NULL,
	`stock` integer,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`requested_by` text NOT NULL,
	`event_id` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`participant_count` integer NOT NULL,
	`purpose` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bookings_room_time_idx` ON `room_bookings` (`room_id`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `room_bookings` (`status`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`capacity` integer NOT NULL,
	`location` text,
	`equipment_json` text DEFAULT '[]' NOT NULL,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`unlocked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_achievement_uq` ON `user_achievements` (`user_id`,`achievement_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'student' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`created_at` integer NOT NULL,
	`created_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `xp_user_created_idx` ON `xp_transactions` (`user_id`,`created_at`);