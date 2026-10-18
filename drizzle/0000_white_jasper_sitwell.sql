CREATE TABLE `consequence_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL,
	`seat_a_hash` text NOT NULL,
	`seat_b_hash` text,
	`invite_hash` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
