
import { pgTable, text, integer, timestamp, uuid, index, primaryKey, customType, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// CamelCase en TS, snake_case en DB
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentCode: text("student_code").notNull().unique(),
  name: text("name").notNull(), // Nombre real que viene de SIIAU
  username: text("username").notNull().unique(), // El "handle" del usuario en Kyboo
  email: text("email"), // Correo institucional UDG (@alumnos.udg.mx o @academicos.udg.mx)
  password: text("password").notNull(), // Hash de la contraseña
  imageURL: text("image_url"),
  preferences: text("preferences").array().notNull().default([]),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  strikes: integer("strikes").default(0).notNull(),
  suspendedUntil: timestamp("suspended_until"),
  banned: boolean("banned").default(false).notNull(),
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
  // Hora de encuentro (formato HH:mm)
  meetingTime: text("meeting_time"),
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
      "exchange_reminder_tomorrow", "exchange_reminder_today",
      "friend_request", "friend_accepted", "friend_declined",
      "strike_received",
      "review_request"
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

// ─── Tabla para reseñas de usuarios ─────────────────────────────────────────
export const userReviews = pgTable("user_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Quien deja la reseña
  reviewerId: uuid("reviewer_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Quien recibe la reseña
  reviewedId: uuid("reviewed_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Intercambio asociado
  exchangeId: uuid("exchange_id")
    .references(() => exchanges.id, { onDelete: "cascade" })
    .notNull(),
  // Calificación de 1 a 5 estrellas
  rating: integer("rating").notNull(),
  // Comentario opcional
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    reviewerIdx: index("review_reviewer_idx").on(table.reviewerId),
    reviewedIdx: index("review_reviewed_idx").on(table.reviewedId),
    exchangeIdx: index("review_exchange_idx").on(table.exchangeId),
    // Un reviewer solo puede dejar una reseña por exchange
    uniqueReviewIdx: index("review_unique_idx").on(table.reviewerId, table.exchangeId),
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

// ─── Tabla para tokens de recuperación de contraseña ────────────────────────
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Usuario que solicitó el reset
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Token único para el reset (se envía por correo)
  token: text("token").notNull().unique(),
  // Fecha de expiración (1 hora desde la creación)
  expiresAt: timestamp("expires_at").notNull(),
  // Si ya fue usado
  used: integer("used").default(0).notNull(), // 0 = no usado, 1 = usado
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    tokenIdx: index("prt_token_idx").on(table.token),
    userIdx: index("prt_user_idx").on(table.userId),
  };
});

// ─── Tabla para tokens de verificación de cuenta ────────────────────────
export const accountVerificationTokens = pgTable("account_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Usuario que se está verificando
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // Token único para la verificación
  token: text("token").notNull().unique(),
  // Fecha de expiración
  expiresAt: timestamp("expires_at").notNull(),
  // Si ya fue usado
  used: integer("used").default(0).notNull(), // 0 = no usado, 1 = usado
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    tokenIdx: index("avt_token_idx").on(table.token),
    userIdx: index("avt_user_idx").on(table.userId),
  };
});

// ─── Tabla para reportes de usuarios ─────────────────────────────────────────
export const userReports = pgTable("user_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  reportedId: uuid("reported_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  reason: text("reason").notNull(),
  imageUrl: text("image_url"),
  status: text("status", { enum: ["pending", "reviewed", "dismissed"] })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    reporterIdx: index("ur_reporter_idx").on(table.reporterId),
    reportedIdx: index("ur_reported_idx").on(table.reportedId),
    statusIdx: index("ur_status_idx").on(table.status),
  };
});

// ─── Tablas para Sistema de Soporte y Apelaciones ────────────────────────────
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  adminId: uuid("admin_id")
    .references(() => users.id),
  type: text("type", { enum: ["appeal", "issue", "other"] }).notNull(),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] })
    .default("open")
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index("st_user_idx").on(table.userId),
    adminIdx: index("st_admin_idx").on(table.adminId),
    statusIdx: index("st_status_idx").on(table.status),
  };
});

export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .references(() => supportTickets.id, { onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isRead: integer("is_read").default(0).notNull(), // 0 = no leído, 1 = leído
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    ticketIdx: index("tm_ticket_idx").on(table.ticketId),
    createdAtIdx: index("tm_created_at_idx").on(table.createdAt),
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