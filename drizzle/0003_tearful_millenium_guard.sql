CREATE TABLE "exchange_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"desired_start_date" timestamp,
	"desired_end_date" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"meeting_location" text NOT NULL,
	"requester_note" text,
	"owner_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exchange_waitlist" ADD CONSTRAINT "exchange_waitlist_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_waitlist" ADD CONSTRAINT "exchange_waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waitlist_book_idx" ON "exchange_waitlist" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "waitlist_user_idx" ON "exchange_waitlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "waitlist_created_at_idx" ON "exchange_waitlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "exchange_book_idx" ON "exchanges" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "exchange_owner_idx" ON "exchanges" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "exchange_requester_idx" ON "exchanges" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "exchange_status_idx" ON "exchanges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exchange_dates_idx" ON "exchanges" USING btree ("start_date","end_date");