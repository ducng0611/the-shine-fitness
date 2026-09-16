import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (maps to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('member'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  gender: text('gender'),
  memberCode: text('member_code'),
  packageCode: text('package_code'),
  packageInterested: text('package_interested'),
  totalSpent: integer('total_spent').default(0),
  checkinCount: integer('checkin_count').default(0),
  journeyStage: text('journey_stage').default('awareness'),
  matchedPersona: text('matched_persona'),
  customerSegment: text('customer_segment'),
  churnRisk: text('churn_risk'),
  membershipStatus: text('membership_status').default('Mới'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Check-ins table
export const checkins = pgTable('checkins', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  memberCode: text('member_code').notNull(),
  checkinTime: timestamp('checkin_time').defaultNow(),
  workoutType: text('workout_type'),
  notes: text('notes'),
});

// Gym Packages table
export const gymPackages = pgTable('gym_packages', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  durationMonths: integer('duration_months').notNull(),
  durationLabel: text('duration_label').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  checkins: many(checkins),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  customer: one(customers, {
    fields: [checkins.customerId],
    references: [customers.id],
  }),
}));
