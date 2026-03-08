
import { pgTable, text, integer, timestamp, uuid, index, primaryKey, customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
  status: text("status", { enum: ["disponible", "ocupado", "intercambiado"] })
    .default("disponible")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    titleIdx: index("title_idx").on(table.title),
    authorIdx: index("author_idx").on(table.author),
    genresIdx: index("genres_gin_idx").using("gin", table.genres),
  };
});

// Tabla para salas de chat entre usuarios
export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  participant1Id: uuid("participant1_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  participant2Id: uuid("participant2_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Índice único para prevenir salas duplicadas entre los mismos usuarios
    // Ordenamos los IDs para asegurar unicidad sin importar el orden
    participantsIdx: index("participants_idx").on(table.participant1Id, table.participant2Id),
  };
});

// Tabla para mensajes de chat
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .references(() => chatRooms.id, { onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  isRead: integer("is_read").default(0).notNull(), // 0 = no leído, 1 = leído
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    roomIdx: index("room_idx").on(table.roomId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  };
});

// Tabla para comunidades
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  genres: text("genres").array().notNull().default([]),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    genresIdx: index("communities_genres_gin_idx").using("gin", table.genres),
  };
});

// Tabla para miembros de comunidades
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

// Tabla para posts en comunidades
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  communityId: uuid("community_id").references(() => communities.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
});

// Tabla para comentarios en posts
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => posts.id).notNull(),
  parentId: uuid("parent_id"), // Self-reference para respuestas anidadas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
});

// Tabla para likes en posts (relación muchos a muchos)
export const postLikes = pgTable("post_likes", {
  userId: uuid("user_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => posts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.postId] }),
  };
});

// ─── Tabla para intercambios de libros ──────────────────────────────────────
export const exchanges = pgTable("exchanges", {
  id: uuid("id").primaryKey().defaultRandom(),
  // El libro que se intercambia
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  // Dueño del libro (quien lo presta)
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Solicitante (quien pide el libro)
  requesterId: uuid("requester_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Estado del intercambio
  status: text("status", {
    enum: ["pendiente", "aceptado", "rechazado", "en_curso", "completado", "cancelado"],
  })
    .default("pendiente")
    .notNull(),
  // Fechas del préstamo
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  // Lugar de entrega dentro de CUCEI
  meetingLocation: text("meeting_location").notNull(),
  // Notas opcionales del solicitante
  requesterNote: text("requester_note"),
  // Notas opcionales del dueño (al aceptar/rechazar)
  ownerNote: text("owner_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    bookIdx: index("exchange_book_idx").on(table.bookId),
    ownerIdx: index("exchange_owner_idx").on(table.ownerId),
    requesterIdx: index("exchange_requester_idx").on(table.requesterId),
    statusIdx: index("exchange_status_idx").on(table.status),
    datesIdx: index("exchange_dates_idx").on(table.startDate, table.endDate),
  };
});

// ─── Tabla para notificaciones ──────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Usuario que recibe la notificación
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Tipo de notificación
  type: text("type", {
    enum: [
      "exchange_requested", "exchange_accepted", "exchange_rejected", "exchange_auto_rejected", "exchange_started", "exchange_completed", "exchange_cancelled",
      "friend_request", "friend_accepted", "friend_declined"
    ],
  }).notNull(),
  // Mensaje descriptivo
  message: text("message").notNull(),
  // Referencia opcional al intercambio
  exchangeId: uuid("exchange_id")
    .references(() => exchanges.id, { onDelete: "cascade" }),
  // Referencia opcional a la solicitud de amistad
  friendRequestId: uuid("friend_request_id"), // Añadiremos la foreign key manual o simplemente almacenamos el id
  // Estado de lectura
  isRead: integer("is_read").default(0).notNull(), // 0 = no leído, 1 = leído
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index("notification_user_idx").on(table.userId),
    readIdx: index("notification_read_idx").on(table.isRead),
  };
});

// ─── Tabla para favoritos de libros ─────────────────────────────────────────
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    bookIdx: index("favorites_book_idx").on(table.bookId),
    userIdx: index("favorites_user_idx").on(table.userId),
    // Prevenir duplicados: un usuario solo puede dar favorito una vez a un libro
    uniqueIdx: index("favorites_unique_idx").on(table.userId, table.bookId),
  };
});

// ─── Tabla para recomendaciones de libros en comunidades ────────────────────
export const communityBookRecommendations = pgTable("community_book_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id")
    .references(() => communities.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    communityIdx: index("cbr_community_idx").on(table.communityId),
    userIdx: index("cbr_user_idx").on(table.userId),
    // Un libro solo puede ser recomendado una vez por comunidad
    uniqueBookIdx: index("cbr_unique_book_idx").on(table.communityId, table.bookId),
  };
});

// ─── Tabla para amigos ──────────────────────────────────────────────────────
export const friends = pgTable("friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  addresseeId: uuid("addressee_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined"] })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    requesterIdx: index("friend_requester_idx").on(table.requesterId),
    addresseeIdx: index("friend_addressee_idx").on(table.addresseeId),
    statusIdx: index("friend_status_idx").on(table.status),
    uniqueIdx: index("friend_unique_idx").on(table.requesterId, table.addresseeId),
  };
});

const vector50 = customType<{ data: number[] }>({
  dataType() {
    return "vector(50)";
  },
});

export const userVectors = pgTable("user_vectors", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  embedding: vector50("embedding").notNull(),
});

export const bookVectors = pgTable("book_vectors", {
  bookId: uuid("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  embedding: vector50("embedding").notNull(),
});

export const communityVectors = pgTable("community_vectors", {
  communityId: uuid("community_id")
    .primaryKey()
    .references(() => communities.id, { onDelete: "cascade" }),
  embedding: vector50("embedding").notNull(),
});