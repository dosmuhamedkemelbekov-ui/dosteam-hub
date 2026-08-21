import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull().unique(), passwordHash: text("password_hash"),
  role: text("role", { enum: ["student", "club_manager", "event_organizer", "admin"] }).notNull().default("student"),
  status: text("status", { enum: ["active", "blocked", "pending"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
  mfaVerifiedAt: integer("mfa_verified_at"),
}, (t) => [index("auth_sessions_user_idx").on(t.userId), index("auth_sessions_expires_idx").on(t.expiresAt)]);

export const levels = sqliteTable("levels", {
  id: integer("id").primaryKey({ autoIncrement: true }), nameRu: text("name_ru").notNull(), nameKk: text("name_kk"),
  minXp: integer("min_xp").notNull(), rank: integer("rank").notNull(), icon: text("icon"), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
}, (t) => [uniqueIndex("levels_rank_uq").on(t.rank), uniqueIndex("levels_min_xp_uq").on(t.minXp)]);

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), fullName: text("full_name").notNull(),
  studentId: text("student_id").unique(), faculty: text("faculty"), groupName: text("group_name"), course: integer("course"),
  avatarUrl: text("avatar_url"), bio: text("bio"), interests: text("interests_json").notNull().default("[]"),
  xp: integer("xp").notNull().default(0), coinBalance: integer("coin_balance").notNull().default(0), levelId: integer("level_id").references(() => levels.id),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
});

export const clubs = sqliteTable("clubs", {
  id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique(), description: text("description").notNull(),
  direction: text("direction").notNull(), managerId: text("manager_id").notNull().references(() => users.id), logoUrl: text("logo_url"), coverUrl: text("cover_url"),
  instagram: text("instagram"), telegram: text("telegram"), contacts: text("contacts"), plannedActivity: text("planned_activity"),
  status: text("status", { enum: ["pending", "approved", "active", "rejected", "archived"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(), approvedAt: integer("approved_at", { mode: "timestamp" }), approvedBy: text("approved_by").references(() => users.id),
}, (t) => [index("clubs_status_idx").on(t.status), index("clubs_direction_idx").on(t.direction)]);

export const clubFollows = sqliteTable("club_follows", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), clubId: text("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).notNull().default(true), createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [uniqueIndex("club_follows_user_club_uq").on(t.userId, t.clubId), index("club_follows_club_idx").on(t.clubId)]);

export const clubMemberships = sqliteTable("club_memberships", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), clubId: text("club_id").notNull().references(() => clubs.id),
  role: text("role", { enum: ["member", "manager", "moderator"] }).notNull().default("member"),
  status: text("status", { enum: ["pending", "approved", "rejected", "left"] }).notNull().default("pending"),
  motivation: text("motivation"), appliedAt: integer("applied_at", { mode: "timestamp" }).notNull(), reviewedAt: integer("reviewed_at", { mode: "timestamp" }), reviewedBy: text("reviewed_by").references(() => users.id),
}, (t) => [uniqueIndex("memberships_user_club_uq").on(t.userId, t.clubId), index("memberships_club_status_idx").on(t.clubId, t.status)]);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(), clubId: text("club_id").notNull().references(() => clubs.id), authorId: text("author_id").notNull().references(() => users.id),
  body: text("body").notNull(), tags: text("tags_json").notNull().default("[]"), linkUrl: text("link_url"), media: text("media_json").notNull().default("[]"),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("published"), viewCount: integer("view_count").notNull().default(0),
  publishedAt: integer("published_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => [index("posts_club_published_idx").on(t.clubId, t.publishedAt)]);

export const postReactions = sqliteTable("post_reactions", {
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["like", "save"] }).notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [uniqueIndex("post_reactions_uq").on(t.postId, t.userId, t.type)]);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(), postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id),
  parentId: text("parent_id"), body: text("body").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (t) => [index("comments_post_idx").on(t.postId, t.createdAt)]);

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(), name: text("name").notNull(), capacity: integer("capacity").notNull(), location: text("location"),
  equipment: text("equipment_json").notNull().default("[]"), imageUrl: text("image_url"), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(), title: text("title").notNull(), description: text("description").notNull(), organizerId: text("organizer_id").notNull().references(() => users.id), clubId: text("club_id").references(() => clubs.id),
  roomId: text("room_id").references(() => rooms.id), placeText: text("place_text"), category: text("category"), coverUrl: text("cover_url"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(), endsAt: integer("ends_at", { mode: "timestamp" }).notNull(), capacity: integer("capacity").notNull(),
  xpReward: integer("xp_reward").notNull().default(0), coinReward: integer("coin_reward").notNull().default(0),
  status: text("status", { enum: ["draft", "published", "cancelled", "completed"] }).notNull().default("draft"), registrationSource: text("registration_source"),
}, (t) => [index("events_start_idx").on(t.startsAt), index("events_club_idx").on(t.clubId)]);

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(), eventId: text("event_id").notNull().references(() => events.id), userId: text("user_id").notNull().references(() => users.id),
  ticketCode: text("ticket_code").notNull().unique(), status: text("status", { enum: ["registered", "attended", "no_show", "cancelled"] }).notNull().default("registered"),
  source: text("source").default("hub"), registeredAt: integer("registered_at", { mode: "timestamp" }).notNull(), attendedAt: integer("attended_at", { mode: "timestamp" }), scannedBy: text("scanned_by").references(() => users.id),
}, (t) => [uniqueIndex("registrations_event_user_uq").on(t.eventId, t.userId), index("registrations_event_status_idx").on(t.eventId, t.status)]);

export const roomBookings = sqliteTable("room_bookings", {
  id: text("id").primaryKey(), roomId: text("room_id").notNull().references(() => rooms.id), requestedBy: text("requested_by").notNull().references(() => users.id), eventId: text("event_id").references(() => events.id),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(), endsAt: integer("ends_at", { mode: "timestamp" }).notNull(), participantCount: integer("participant_count").notNull(), purpose: text("purpose").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] }).notNull().default("pending"), reviewedBy: text("reviewed_by").references(() => users.id), reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
}, (t) => [index("bookings_room_time_idx").on(t.roomId, t.startsAt, t.endsAt), index("bookings_status_idx").on(t.status)]);

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(), name: text("name").notNull(), description: text("description").notNull(), icon: text("icon"), category: text("category"),
  ruleType: text("rule_type").notNull(), ruleValue: integer("rule_value").notNull(), xpReward: integer("xp_reward").notNull().default(0), coinReward: integer("coin_reward").notNull().default(0),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const userAchievements = sqliteTable("user_achievements", {
  userId: text("user_id").notNull().references(() => users.id), achievementId: text("achievement_id").notNull().references(() => achievements.id),
  progress: real("progress").notNull().default(0), unlockedAt: integer("unlocked_at", { mode: "timestamp" }),
}, (t) => [uniqueIndex("user_achievement_uq").on(t.userId, t.achievementId)]);

export const xpTransactions = sqliteTable("xp_transactions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), amount: integer("amount").notNull(),
  reason: text("reason").notNull(), sourceType: text("source_type").notNull(), sourceId: text("source_id"), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), createdBy: text("created_by").references(() => users.id),
}, (t) => [index("xp_user_created_idx").on(t.userId, t.createdAt), uniqueIndex("xp_reward_source_uq").on(t.userId, t.sourceType, t.sourceId)]);

export const coinTransactions = sqliteTable("coin_transactions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), amount: integer("amount").notNull(), balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(), sourceType: text("source_type").notNull(), sourceId: text("source_id"), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), createdBy: text("created_by").references(() => users.id),
}, (t) => [index("coins_user_created_idx").on(t.userId, t.createdAt), uniqueIndex("coin_reward_source_uq").on(t.userId, t.sourceType, t.sourceId)]);

export const rewards = sqliteTable("rewards", {
  id: text("id").primaryKey(), name: text("name").notNull(), description: text("description").notNull(), cost: integer("cost").notNull(), stock: integer("stock"), imageUrl: text("image_url"), isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const rewardOrders = sqliteTable("reward_orders", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), rewardId: text("reward_id").notNull().references(() => rewards.id), cost: integer("cost").notNull(),
  status: text("status", { enum: ["pending", "approved", "fulfilled", "cancelled"] }).notNull().default("pending"), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), fulfilledAt: integer("fulfilled_at", { mode: "timestamp" }),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), type: text("type").notNull(), title: text("title").notNull(),
  body: text("body").notNull(), actionUrl: text("action_url"), readAt: integer("read_at", { mode: "timestamp" }), createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt, t.createdAt)]);

export const uploads = sqliteTable("uploads", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull().references(() => users.id), objectKey: text("object_key").notNull().unique(),
  fileName: text("file_name").notNull(), contentType: text("content_type").notNull(), sizeBytes: integer("size_bytes").notNull(),
  purpose: text("purpose", { enum: ["avatar", "club_logo", "club_cover", "event_cover", "post_media"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(), deletedAt: integer("deleted_at", { mode: "timestamp" }),
}, (t) => [index("uploads_owner_idx").on(t.ownerId, t.createdAt)]);
