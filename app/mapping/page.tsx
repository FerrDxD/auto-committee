import { db } from '@/lib/db';
import { orgRoles, committeeSections, roleMappingRules, organizations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Trash2, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default async function MappingPage() {
  // Ambil data roles dan mapping
  const roles = await db.select().from(orgRoles);
  const mappings = await db
    .select({ 
      id: roleMappingRules.id, 
      roleName: orgRoles.roleName, 
      sectionName: committeeSections.sectionName, 
      score: roleMappingRules.relevanceScore 
    })
    .from(roleMappingRules)
    .innerJoin(orgRoles, eq(roleMappingRules.orgRoleId, orgRoles.id))
    .innerJoin(committeeSections, eq(roleMappingRules.committeeSectionId, committeeSections.id))
    .orderBy(desc(roleMappingRules.relevanceScore));

  async function createMapping(formData: FormData) {
    'use server';
    const roleId = formData.get('roleId') as string;
    const sectionName = formData.get('sectionName') as string;
    const score = parseInt(formData.get('score') as string) || 100;
    
    const orgs = await db.select().from(organizations).limit(1);
    if (orgs.length === 0) return;
    const orgId = orgs[0].id;

    let [section] = await db.select().from(committeeSections).where(eq(committeeSections.sectionName, sectionName));
    if (!section) [section] = await db.insert(committeeSections).values({ organizationId: orgId, sectionName }).returning();
    
    await db.insert(roleMappingRules).values({ 
      orgRoleId: roleId, 
      committeeSectionId: section.id, 
      relevanceScore: score 
    });
    
    revalidatePath('/mapping');
  }

  async function deleteMapping(formData: FormData) {
    'use server';
    await db.delete(roleMappingRules).where(eq(roleMappingRules.id, formData.get('mappingId') as string));
    revalidatePath('/mapping');
  }

  return (
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-2">
          <BrainCircuit className="w-4 h-4" /> Machine Learning Logic
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">Training <span className="text-primary">AI</span></h1>
        <p className="text-muted-foreground text-lg mt-2">Atur kecerdasan algoritma dalam menempatkan anggota OSIS & MPK.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Panel Kiri: Form Aturan */}
        <div className="lg:col-span-4">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl sticky top-24">
            <CardHeader className="border-b border-border/40 pb-6 bg-muted/20">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Aturan Baru
              </CardTitle>
              <CardDescription className="font-medium">Hubungkan Jabatan Organisasi ke Seksi Panitia.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form action={createMapping} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary/70">Jabatan Asal</label>
                  <select name="roleId" required className="flex h-12 w-full rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="">Pilih Jabatan...</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.roleName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary/70">Target Seksi</label>
                  <Input name="sectionName" placeholder="Contoh: Humas" required className="h-12 rounded-xl bg-background/50 border-border/60 font-semibold focus:bg-background transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary/70">Skor Prioritas (1-100)</label>
                  <Input type="number" name="score" defaultValue="100" min="1" max="100" required className="h-12 rounded-xl bg-background/50 border-border/60 font-bold focus:bg-background transition-all" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-black text-base shadow-lg shadow-primary/20 transition-transform active:scale-95">
                  Simpan Aturan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Panel Kanan: Knowledge Base */}
        <Card className="lg:col-span-8 border-border/40 bg-card/20 backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-border/40 bg-muted/10 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" /> Current Knowledge Base
            </h3>
            <Badge variant="outline" className="border-primary/30 text-primary font-bold px-3 py-1">
              {mappings.length} Aturan Aktif
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-bold py-4">Jabatan Organisasi</TableHead>
                  <TableHead></TableHead>
                  <TableHead className="font-bold">Target Seksi</TableHead>
                  <TableHead className="text-center font-bold">Skor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map(map => (
                  <TableRow key={map.id} className="border-border/40 group hover:bg-primary/[0.03] transition-colors">
                    <TableCell className="font-bold text-base py-5">{map.roleName}</TableCell>
                    <TableCell className="w-10 text-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-bold">
                        {map.sectionName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20">
                        {map.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <form action={deleteMapping}>
                        <input type="hidden" name="mappingId" value={map.id} />
                        <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {mappings.length === 0 && (
              <div className="py-24 text-center text-muted-foreground font-medium italic">
                Algoritma belum dilatih. Tambahkan aturan pertama Anda.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}