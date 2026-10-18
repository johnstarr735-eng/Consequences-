CREATE TABLE `consequence_seat_keys` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`seat` text NOT NULL,
	`account_id` text,
	`created_at` integer NOT NULL
);
