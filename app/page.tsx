import { db } from '@/lib/db';
import { events, organizations } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { CalendarDays, PlusCircle, Wand2, CalendarX2, Sparkles } from 'lucide-react';

async function createEvent(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const eventDate = formData.get('date') as string;

  const orgs = await db.select().from(organizations).limit(1);
  if (orgs.length === 0) return;

  await db.insert(events).values({
    organizationId: orgs[0].id,
    name,
    eventDate: new Date(eventDate),
  });

  revalidatePath('/');
}

export default async function DashboardPage() {
  const allEvents = await db.select().from(events).orderBy(events.eventDate);

  return (
    <div className="container mx-auto px-6 max-w-5xl">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Workspace
          </span> Kepanitiaan
        </h1>
        <p className="text-muted-foreground text-lg">Kelola dan bentuk panitia SMAN 2 Jonggol secara cerdas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kiri: Form Buat Event */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 border-border/50 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/10 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlusCircle className="w-5 h-5 text-primary" /> Buat Event
              </CardTitle>
              <CardDescription>Jadwalkan agenda baru ke sistem.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={createEvent} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="name" className="text-foreground font-semibold">Nama Event</Label>
                  <Input id="name" name="name" placeholder="Misal: LDKS 2026" required className="h-11 bg-background/50 border-border/50 focus:bg-background transition-all" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="date" className="text-foreground font-semibold">Tanggal Pelaksanaan</Label>
                  <Input id="date" name="date" type="date" required className="h-11 bg-background/50 border-border/50 focus:bg-background transition-all" />
                </div>
                <Button type="submit" className="w-full h-11 font-bold shadow-md hover:shadow-primary/25 transition-all">
                  <Sparkles className="w-4 h-4 mr-2" /> Tambahkan Event
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kanan: Daftar Event */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Agenda Mendatang</h2>
            <Badge variant="secondary" className="px-3 py-1">{allEvents.length} Event</Badge>
          </div>
          
          {allEvents.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50 bg-card/30 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="p-4 bg-muted/30 rounded-full mb-4">
                  <CalendarX2 className="w-10 h-10 opacity-60" />
                </div>
                <p className="font-bold text-foreground text-lg">Belum ada agenda</p>
                <p className="text-sm">Mulai dengan menambahkan event di panel kiri.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {allEvents.map((event) => (
                <Card key={event.id} className="group overflow-hidden border-border/50 bg-card/60 backdrop-blur-md hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-3.5 rounded-xl border border-primary/10 text-primary group-hover:scale-105 transition-transform">
                          <CalendarDays className="w-6 h-6" />
                        </div>
                        <div className="pt-1">
                          <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                            {event.name}
                          </h3>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-1">
                            {event.eventDate.toLocaleDateString('id-ID', { 
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <Link href={`/events/${event.id}/builder`} className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full sm:w-auto gap-2 bg-background border border-border/50 shadow-sm group-hover:border-primary/30 group-hover:bg-primary/5 transition-all h-10">
                          <Wand2 className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Buka Workspace</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}