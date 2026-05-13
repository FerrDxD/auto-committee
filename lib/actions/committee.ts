'use server';

import { db } from '../db';
import { members, roleMappingRules, eventCommittees, committeeSections, organizations } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function generateCommittee(
  eventId: string,
  requirements: { sectionId: string; count: number }[]
) {
  try {
    console.log("Memulai Generate untuk Event:", eventId);
    
    const allMembers = await db.select().from(members);
    let availableMembers = [...allMembers];

    const rules = await db
      .select()
      .from(roleMappingRules)
      .orderBy(desc(roleMappingRules.relevanceScore));

    const assignments: any[] = [];

    for (const req of requirements) {
      let assignedCount = 0;
      const sectionRules = rules.filter(r => r.committeeSectionId === req.sectionId);

      // Tahap 1: Berdasarkan Rules
      for (const rule of sectionRules) {
        if (assignedCount >= req.count) break;
        const matching = availableMembers.filter(m => m.orgRoleId === rule.orgRoleId);
        for (const m of matching) {
          if (assignedCount >= req.count) break;
          assignments.push({ eventId, memberId: m.id, committeeSectionId: req.sectionId });
          assignedCount++;
          availableMembers = availableMembers.filter(am => am.id !== m.id);
        }
      }

      // Tahap 2: Random Fallback
      while (assignedCount < req.count && availableMembers.length > 0) {
        const randIdx = Math.floor(Math.random() * availableMembers.length);
        const m = availableMembers[randIdx];
        assignments.push({ eventId, memberId: m.id, committeeSectionId: req.sectionId });
        assignedCount++;
        availableMembers.splice(randIdx, 1);
      }
    }

    // DB TRANSACTION
    await db.delete(eventCommittees).where(eq(eventCommittees.eventId, eventId));
    if (assignments.length > 0) {
      await db.insert(eventCommittees).values(assignments);
      console.log(`Berhasil simpan ${assignments.length} anggota.`);
    }

    revalidatePath(`/events/${eventId}/builder`);
    return { success: true };
  } catch (err) {
    console.error("Gagal total:", err);
    return { success: false };
  }
}

export async function generateCustomCommittee(
  eventId: string, 
  customReqs: { name: string; count: number }[]
) {
  const orgs = await db.select().from(organizations).limit(1);
  const orgId = orgs[0].id;

  const requirements = [];
  for (const req of customReqs) {
    let [sec] = await db.select().from(committeeSections).where(eq(committeeSections.sectionName, req.name));
    if (!sec) {
      [sec] = await db.insert(committeeSections).values({ organizationId: orgId, sectionName: req.name }).returning();
    }
    requirements.push({ sectionId: sec.id, count: req.count });
  }

  // Panggil generateCommittee, jangan panggil diri sendiri!
  return await generateCommittee(eventId, requirements);
}

// Tambahkan di bagian paling bawah lib/actions/committee.ts
export async function moveCommitteeMember(
  eventId: string,
  memberId: string,
  newSectionName: string
) {
  try {
    const orgs = await db.select().from(organizations).limit(1);
    
    // Cari ID seksi tujuan
    let [section] = await db.select().from(committeeSections)
      .where(eq(committeeSections.sectionName, newSectionName));

    if (!section) {
      // Buat seksi kalau belum ada (jaga-jaga)
      [section] = await db.insert(committeeSections).values({ 
        organizationId: orgs[0].id, 
        sectionName: newSectionName 
      }).returning();
    }

    // Update data panitia ke seksi baru
    await db.update(eventCommittees)
      .set({ committeeSectionId: section.id })
      .where(
        and(
          eq(eventCommittees.eventId, eventId),
          eq(eventCommittees.memberId, memberId)
        )
      );

    revalidatePath(`/events/${eventId}/builder`);
    return { success: true };
  } catch (error) {
    console.error("Gagal memindahkan anggota:", error);
    return { success: false };
  }
}