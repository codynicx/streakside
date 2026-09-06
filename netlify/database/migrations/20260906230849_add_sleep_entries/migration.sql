CREATE TABLE "sleep_entries" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"sleep_date" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"quality" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sleep_entries_owner_date_unique" ON "sleep_entries" ("owner_id","sleep_date");--> statement-breakpoint
ALTER TABLE "sleep_entries" ADD CONSTRAINT "sleep_entries_owner_id_profiles_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE;