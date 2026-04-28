import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const authors = mysqlTable("authors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Author = typeof authors.$inferSelect;
export type InsertAuthor = typeof authors.$inferInsert;

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  wpId: int("wpId"),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featuredImage"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  author: varchar("author", { length: 255 }).default("Cenas de Combate"),
  authorId: int("authorId"),
  viewCount: int("viewCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const postCategories = mysqlTable("post_categories", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  categoryId: int("categoryId").notNull(),
});

export type PostCategory = typeof postCategories.$inferSelect;
export type InsertPostCategory = typeof postCategories.$inferInsert;

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  wpUrl: text("wpUrl"),
  s3Key: varchar("s3Key", { length: 1000 }),
  s3Url: text("s3Url"),
  filename: varchar("filename", { length: 500 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: bigint("fileSize", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;
