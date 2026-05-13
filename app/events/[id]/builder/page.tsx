import { db } from '@/lib/db';
import { events, eventCommittees, members, committeeSections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';
import { BuilderClientForm } from './client-form';
import { ArrowLeft, Zap, LayoutGrid, Info } from 'lucide-react';
import Link from 'next/link';
import { InteractiveBoard } from './dnd-board'; // <-- IMPORT BARU

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;

  const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0];
  if (!event) return <div className="text-center py-20 font-bold">Event tidak ditemukan!</div>;

  // PERUBAHAN QUERY: Tambahkan members.id agar drag-and-drop punya kunci unik
  const currentCommittee = await db
    .select({
      memberId: members.id, // <-- INI PENTING
      memberName: members.name,
      sectionName: committeeSections.sectionName,
    })
    .from(eventCommittees)
    .innerJoin(members, eq(eventCommittees.memberId, members.id))
    .innerJoin(committeeSections, eq(eventCommittees.committeeSectionId, committeeSections.id))
    .where(eq(eventCommittees.eventId, eventId));

  const sections = Array.from(new Set(currentCommittee.map(c => c.sectionName)));

  return (
    <div className="container mx-auto px-6 max-w-6xl">
      <Link href="/" className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-8 transition-all px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-md border border-border/50">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-2">
            <Zap className="w-4 h-4 fill-primary" /> Event Manager
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">{event.name}</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-3 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-xl shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Anggota</p>
            <p className="text-2xl font-black text-primary">{currentCommittee.length}</p>
          </div>
          <div className="px-6 py-3 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-xl shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Seksi</p>
            <p className="text-2xl font-black text-primary">{sections.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <BuilderClientForm eventId={eventId} />
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary/80 leading-relaxed font-medium">
                Sistem mengutamakan prioritas algoritma. <strong>Tahan & Geser (Drag)</strong> nama anggota untuk memindahkan mereka ke divisi lain.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {currentCommittee.length === 0 ? (
            <Card className="h-[400px] flex flex-col items-center justify-center border-dashed border-2 bg-muted/5">
              <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-xl">Siap Memulai?</h3>
              <p className="text-muted-foreground text-sm text-center max-w-xs mt-2">
                Konfigurasi jumlah anggota per seksi di panel kiri, lalu tekan generate.
              </p>
            </Card>
          ) : (
            // PASANG KOMPONEN DND DI SINI
            <InteractiveBoard eventId={eventId} initialData={currentCommittee} sections={sections} />
          )}
        </div>
      </div>
    </div>
  );
}