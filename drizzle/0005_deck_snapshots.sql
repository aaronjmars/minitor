CREATE TABLE "deck_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"deck_id" text NOT NULL,
	"snapshot_json" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_snapshots" ADD CONSTRAINT "deck_snapshots_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_snapshots_deck_captured_idx" ON "deck_snapshots" USING btree ("deck_id","captured_at");