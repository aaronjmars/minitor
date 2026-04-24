CREATE TABLE "columns" (
	"id" text PRIMARY KEY NOT NULL,
	"deck_id" text NOT NULL,
	"type_id" text NOT NULL,
	"title" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" text NOT NULL,
	"column_id" text NOT NULL,
	"author" jsonb NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"created_at" timestamp with time zone NOT NULL,
	"meta" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_items_column_id_id_pk" PRIMARY KEY("column_id","id")
);
--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_items_column_created_idx" ON "feed_items" USING btree ("column_id","created_at");