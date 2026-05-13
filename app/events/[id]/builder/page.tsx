import { db } from '@/lib/db';
import { events, eventCommittees, members, committeeSections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuilderClientForm } from './client-form';
import { Users2, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  // CRITICAL: Harus di-await agar ID-nya terbaca!
  const resolvedParams = await params;
  const eventId = resolvedParams.id;

  const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0];
  if (!event) return <div className="p-20 text-center">Event tidak ditemukan. ID: {eventId}</div>;

  const currentCommittee = await db
    .select({
      memberName: members.name,
      sectionName: committeeSections.sectionName,
    })
    .from(eventCommittees)
    .innerJoin(members, eq(eventCommittees.memberId, members.id))
    .innerJoin(committeeSections, eq(eventCommittees.committeeSectionId, committeeSections.id))
    .where(eq(eventCommittees.eventId, eventId));

  const sections = Array.from(new Set(currentCommittee.map(c => c.sectionName)));

  return (
    <div className="container mx-auto px-6 max-w-5xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-4xl font-black mb-10 tracking-tight">{event.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <BuilderClientForm eventId={eventId} />
        </div>

        <div className="lg:col-span-8">
          <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-primary" /> Hasil Panitia
                </CardTitle>
                <Badge variant="secondary">{currentCommittee.length} Orang</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {currentCommittee.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                  Belum ada data. Silakan klik Generate.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sections.map(section => (
                    <div key={section} className="p-4 rounded-xl border bg-background/50">
                      <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {section}
                      </h3>
                      <ul className="space-y-1.5">
                        {currentCommittee.filter(c => c.sectionName === section).map((m, i) => (
                          <li key={i} className="text-sm p-2 rounded-md bg-muted/30 border">
                            {m.memberName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}