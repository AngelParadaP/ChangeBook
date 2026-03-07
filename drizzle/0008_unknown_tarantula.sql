CREATE TABLE "friends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "friend_request_id" uuid;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friend_requester_idx" ON "friends" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friend_addressee_idx" ON "friends" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "friend_status_idx" ON "friends" USING btree ("status");--> statement-breakpoint
CREATE INDEX "friend_unique_idx" ON "friends" USING btree ("requester_id","addressee_id");--> statement-breakpoint
CREATE INDEX "genres_gin_idx" ON "books" USING gin ("genres");