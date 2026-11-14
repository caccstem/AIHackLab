import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('study_workspaces', {
  userId: text('user_id').primaryKey(),
  data: text('data').notNull(),
  revision: integer('revision').notNull().default(1),
});

export const accounts = sqliteTable('study_accounts', {
 id: text('id').primaryKey(),
 username: text('username').notNull().unique(),
 name: text('name').notNull(),
 phone: text('phone'),
 avatarKey: text('avatar_key'),
 backgroundKey: text('background_key'),
 sharePhone: integer('share_phone').notNull().default(0),
 grade: text('grade').notNull(),
 passwordHash: text('password_hash').notNull(),
 recoveryHash: text('recovery_hash').notNull(),
 profile: text('profile').notNull().default('{}'),
 createdAt: integer('created_at').notNull(),
});
export const sessions = sqliteTable('study_sessions', {
 tokenHash: text('token_hash').primaryKey(),
 userId: text('user_id').notNull().references(()=>accounts.id),
 expiresAt: integer('expires_at').notNull(),
});
export const authLimits = sqliteTable('study_auth_limits', {
 key: text('key').primaryKey(),
 count: integer('count').notNull().default(0),
 expiresAt: integer('expires_at').notNull(),
});

export const friendships = sqliteTable('study_friendships', {
 id:text('id').primaryKey(),
 userA:text('user_a').notNull().references(()=>accounts.id),
 userB:text('user_b').notNull().references(()=>accounts.id),
 requestedBy:text('requested_by').notNull().references(()=>accounts.id),
 status:text('status').notNull().default('pending'),
 createdAt:integer('created_at').notNull(),
},table=>[index('friendships_a').on(table.userA),index('friendships_b').on(table.userB)]);
export const blocks = sqliteTable('study_blocks', {
 id:text('id').primaryKey(),
 ownerId:text('owner_id').notNull().references(()=>accounts.id),
 peerId:text('peer_id').notNull().references(()=>accounts.id),
});
export const messages = sqliteTable('study_messages', {
 id:integer('id').primaryKey({autoIncrement:true}),
 pairId:text('pair_id').notNull(),
 senderId:text('sender_id').notNull().references(()=>accounts.id),
 receiverId:text('receiver_id').notNull().references(()=>accounts.id),
 body:text('body').notNull(),
 nonce:text('nonce').notNull(),
 createdAt:integer('created_at').notNull(),
},table=>[index('messages_pair').on(table.pairId,table.id),uniqueIndex('messages_sender_nonce').on(table.senderId,table.nonce)]);

export const chatGroups = sqliteTable('study_chat_groups', {
 id:text('id').primaryKey(),
 name:text('name').notNull(),
 createdBy:text('created_by').notNull().references(()=>accounts.id),
 createdAt:integer('created_at').notNull(),
});
export const groupMembers = sqliteTable('study_group_members', {
 id:text('id').primaryKey(),
 groupId:text('group_id').notNull().references(()=>chatGroups.id),
 userId:text('user_id').notNull().references(()=>accounts.id),
 status:text('status').notNull().default('invited'),
 invitedBy:text('invited_by').notNull().references(()=>accounts.id),
},t=>[index('group_members_user').on(t.userId,t.status),index('group_members_group').on(t.groupId,t.status)]);
export const groupMessages = sqliteTable('study_group_messages', {
 id:integer('id').primaryKey({autoIncrement:true}),
 groupId:text('group_id').notNull().references(()=>chatGroups.id),
 senderId:text('sender_id').notNull().references(()=>accounts.id),
 body:text('body').notNull(),
 nonce:text('nonce').notNull(),
 createdAt:integer('created_at').notNull(),
},t=>[index('group_messages_group').on(t.groupId,t.id),uniqueIndex('group_messages_nonce').on(t.senderId,t.nonce)]);
