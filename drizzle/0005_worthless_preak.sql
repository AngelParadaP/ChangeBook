CREATE TABLE "community_book_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_book_recommendations" ADD CONSTRAINT "community_book_recommendations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_book_recommendations" ADD CONSTRAINT "community_book_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_book_recommendations" ADD CONSTRAINT "community_book_recommendations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cbr_community_idx" ON "community_book_recommendations" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "cbr_user_idx" ON "community_book_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cbr_unique_book_idx" ON "community_book_recommendations" USING btree ("community_id","book_id");