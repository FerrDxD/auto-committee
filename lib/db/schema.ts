import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Organizations
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Main Organizational Roles (e.g., "Divisi TIK", "Bendahara")
export const orgRoles = pgTable('org_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  roleName: text('role_name').notNull(),
});

// 3. Organization Members
export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  orgRoleId: uuid('org_role_id').references(() => orgRoles.id).notNull(),
});

// 4. Standard Event Committee Sections (e.g., "Seksi Pubdekdok", "Seksi Acara")
export const committeeSections = pgTable('committee_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sectionName: text('section_name').notNull(),
});

// 5. The Core Engine Table: Role Mapping Rules
export const roleMappingRules = pgTable('role_mapping_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgRoleId: uuid('org_role_id').references(() => orgRoles.id).notNull(),
  committeeSectionId: uuid('committee_section_id').references(() => committeeSections.id).notNull(),
  relevanceScore: integer('relevance_score').notNull(), // e.g., 1 to 100
});

// 6. Events
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  eventDate: timestamp('event_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Generated Event Committees
export const eventCommittees = pgTable('event_committees', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  committeeSectionId: uuid('committee_section_id').references(() => committeeSections.id).notNull(),
});

// --- Drizzle Relations ---
export const membersRelations = relations(members, ({ one }) => ({
  role: one(orgRoles, {
    fields: [members.orgRoleId],
    references: [orgRoles.id],
  }),
}));

export const roleMappingRelations = relations(roleMappingRules, ({ one }) => ({
  orgRole: one(orgRoles, {
    fields: [roleMappingRules.orgRoleId],
    references: [orgRoles.id],
  }),
  committeeSection: one(committeeSections, {
    fields: [roleMappingRules.committeeSectionId],
    references: [committeeSections.id],
  }),
}));