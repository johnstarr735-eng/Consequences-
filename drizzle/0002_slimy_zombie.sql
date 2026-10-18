CREATE TABLE `consequence_state_chunks` (
	`snapshot_id` text NOT NULL,
	`room_id` text NOT NULL,
	`part` integer NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`snapshot_id`, `part`)
);
