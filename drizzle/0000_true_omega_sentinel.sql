CREATE TABLE "books" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"publisher" text,
	"year" integer,
	"image_url" text NOT NULL,
	"description" text NOT NULL,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'disponible' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_code" text NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"image_url" text,
	"preferences" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_student_code_unique" UNIQUE("student_code"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_books_genres ON books USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING GIN (preferences);