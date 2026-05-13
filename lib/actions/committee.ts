'use server';

import { db } from '../db';
import { members, roleMappingRules, eventCommittees, committeeSections, organizations } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// 🧠 FUNGSI INTI: Algoritma Pencocokan + SMART CONSTRAINT (Anti-Burnout)
export async function generateCommittee(
  eventId: string,
  requirements: { sectionId: string; count: number }[]
) {
  try {
    // 1. Ambil data mentah anggota dan SEMUA riwayat panitia
    const allMembersRaw = await db.select().from(members);
    const allHistory = await db.select().from(eventCommittees);

    // 2. Hitung Beban Kerja (Workload) tiap anggota
    const workloadMap = new Map<string, number>();
    
    allHistory.forEach(record => {
      // Hitung event LAIN yang diikuti anggota ini (jangan hitung event yang sedang di-generate)
      if (record.eventId !== eventId) {
        workloadMap.set(record.memberId, (workloadMap.get(record.memberId) || 0) + 1);
      }
    });

    // 3. Suntikkan beban kerja ke profil anggota & URUTKAN (Smart Sorting)
    let availableMembers = allMembersRaw.map(m => ({
      ...m,
      workload: workloadMap.get(m.id) || 0,
      randomTieBreaker: Math.random() // Tie-breaker adil: kalau sama-sama 0 event, acak siapa duluan
    })).sort((a, b) => {
      // Yang beban kerjanya PALING SEDIKIT (nganggur) taruh di paling atas!
      if (a.workload !== b.workload) return a.workload - b.workload;
      return a.randomTieBreaker - b.randomTieBreaker; 
    });

    const rules = await db.select().from(roleMappingRules).orderBy(desc(roleMappingRules.relevanceScore));
    const assignments: any[] = [];

    for (const req of requirements) {
      let assignedCount = 0;
      const sectionRules = rules.filter(r => r.committeeSectionId === req.sectionId);

      // Tahap 1: Jalankan Aturan Mapping (AI Prioritas)
      for (const rule of sectionRules) {
        if (assignedCount >= req.count) break;
        
        // Cari anggota yang jabatannya cocok. 
        // KARENA DAFTAR SUDAH DIURUTKAN, sistem otomatis mengambil anak yang JAGO + PALING NGANGGUR duluan!
        const matching = availableMembers.filter(m => m.orgRoleId === rule.orgRoleId);
        
        for (const m of matching) {
          if (assignedCount >= req.count) break;
          assignments.push({ eventId, memberId: m.id, committeeSectionId: req.sectionId });
          assignedCount++;
          availableMembers = availableMembers.filter(am => am.id !== m.id); // Hapus dari antrean
        }
      }

      // Tahap 2: Fallback (Sisa Kuota)
      while (assignedCount < req.count && availableMembers.length > 0) {
        // KARENA DAFTAR SUDAH DIURUTKAN, index ke-0 selalu anak yang paling jarang dapet tugas!
        const mostAvailableMember = availableMembers[0];
        
        assignments.push({ eventId, memberId: mostAvailableMember.id, committeeSectionId: req.sectionId });
        assignedCount++;
        availableMembers.splice(0, 1); // Buang dari antrean
      }
    }

    // 4. Simpan ke Database
    await db.delete(eventCommittees).where(eq(eventCommittees.eventId, eventId));
    if (assignments.length > 0) {
      await db.insert(eventCommittees).values(assignments);
    }

    revalidatePath(`/events/${eventId}/builder`);
    return { success: true };
  } catch (err) {
    console.error("Gagal total:", err);
    return { success: false };
  }
}

// 🚪 PINTU MASUK UI
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

  return await generateCommittee(eventId, requirements);
}

// 🤏 FUNGSI DRAG & DROP MANUAL
export async function moveCommitteeMember(
  eventId: string,
  memberId: string,
  newSectionName: string
) {
  try {
    const orgs = await db.select().from(organizations).limit(1);
    
    let [section] = await db.select().from(committeeSections).where(eq(committeeSections.sectionName, newSectionName));

    if (!section) {
      [section] = await db.insert(committeeSections).values({ 
        organizationId: orgs[0].id, 
        sectionName: newSectionName 
      }).returning();
    }

    await db.update(eventCommittees)
      .set({ committeeSectionId: section.id })
      .where(and(eq(eventCommittees.eventId, eventId), eq(eventCommittees.memberId, memberId)));

    revalidatePath(`/events/${eventId}/builder`);
    return { success: true };
  } catch (error) {
    console.error("Gagal memindahkan anggota:", error);
    return { success: false };
  }
}