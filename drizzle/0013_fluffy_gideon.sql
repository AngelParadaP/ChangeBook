CREATE TABLE "book_vectors" (
	"book_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_vectors" (
	"community_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vectors" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_vectors" ADD CONSTRAINT "book_vectors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_vectors" ADD CONSTRAINT "community_vectors_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vectors" ADD CONSTRAINT "user_vectors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;