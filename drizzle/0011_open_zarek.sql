CREATE TABLE "community_vectors" (
	"community_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(50) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_vectors" ADD CONSTRAINT "community_vectors_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;