import { pgTable, text, integer, timestamp, uuid, index, primaryKey } from "drizzle-orm/pg-core";

// CamelCase en TS, snake_case en DB
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentCode: text("student_code").notNull().unique(),
  name: text("name").notNull(), // Nombre real que viene de SIIAU
  username: text("username").notNull().unique(), // El "handle" del usuario en Kyboo
  password: text("password").notNull(), // Hash de la contraseña
  imageURL: text("image_url"),
  preferences: text("preferences").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const books = pgTable("books", {
  id: uuid("id").primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => users.id)
    .notNull(), // FK al usuario dueño
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher"),
  year: integer("year"),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  // Columna crítica para el filtrado basado en contenido
  genres: text("genres").array().notNull().default([]),
  status: text("status", { enum: ["disponible", "intercambiado"] })
    .default("disponible")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    titleIdx: index("title_idx").on(table.title),
    authorIdx: index("author_idx").on(table.author),
  };
});

export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMembers = pgTable("community_members", {
  userId: uuid("user_id").references(() => users.id).notNull(),
  communityId: uuid("community_id").references(() => communities.id).notNull(),
  role: text("role", { enum: ["admin", "moderator", "member"] }).default("member").notNull(),
  status: text("status", { enum: ["active", "muted", "banned"] }).default("active").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.communityId] }),
  };
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  communityId: uuid("community_id").references(() => communities.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => posts.id).notNull(),
  parentId: uuid("parent_id"), // Self-reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
});
export const postLikes = pgTable("post_likes", {
  userId: uuid("user_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => posts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.postId] }),
  };
});
