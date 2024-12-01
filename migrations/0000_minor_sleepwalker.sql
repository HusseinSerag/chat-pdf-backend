CREATE TYPE "public"."role_enum" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat-table" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"pdf_name" varchar NOT NULL,
	"pdf_url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"file_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages-table" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" serial NOT NULL,
	"content" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"role" "role_enum" NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages-table" ADD CONSTRAINT "messages-table_chat_id_chat-table_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat-table"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
