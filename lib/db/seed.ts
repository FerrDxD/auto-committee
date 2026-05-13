import { db } from './index';
import { organizations, orgRoles, members } from './schema';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

async function main() {
  console.log('🌱 Memulai proses seeding data OSIS & MPK...');

  try {
    // 1. Buat Organisasi Induk
    const [org] = await db.insert(organizations).values({
      name: 'OSIS & MPK SMAN 2 Jonggol',
    }).returning({ id: organizations.id });

    console.log(`✅ Organisasi terbuat dengan ID: ${org.id}`);

    const readCsv = (fileName: string) => {
      const filePath = path.join(process.cwd(), 'data', fileName);
      if (!fs.existsSync(filePath)) {
        console.error(`⚠️ File tidak ditemukan: ${fileName}`);
        return [];
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true, // Ini penting untuk bersihin spasi liar
      });
    };

    const osisData = readCsv('OSIS.csv');
    const mpkData = readCsv('MPK.csv');
    const allData = [...osisData, ...mpkData];

    console.log(`📊 Total baris terbaca dari CSV: ${allData.length}`);

    // 2. Ekstrak Roles
    const uniqueRoles = Array.from(new Set(allData.map((row: any) => row['JABATAN'])));
    console.log(`Mendaftarkan ${uniqueRoles.length} peran unik...`);
    
    const roleIdMap = new Map<string, string>();

    for (const roleName of uniqueRoles) {
      if (!roleName) continue;
      const [insertedRole] = await db.insert(orgRoles).values({
        organizationId: org.id,
        roleName: roleName,
      }).returning({ id: orgRoles.id });
      roleIdMap.set(roleName, insertedRole.id);
    }

    // 3. Masukkan Anggota satu per satu (Agar kita bisa lihat mana yang error)
    console.log(`Memasukkan anggota ke database...`);
    let successCount = 0;

    for (const row of (allData as any[])) {
      const roleId = roleIdMap.get(row['JABATAN']);
      
      if (!row['NAMA'] || !roleId) {
        console.warn(`⚠️ Melewati baris: ${row['NAMA']} (Jabatan tidak cocok/kosong)`);
        continue;
      }

      try {
        await db.insert(members).values({
          organizationId: org.id,
          name: row['NAMA'],
          orgRoleId: roleId,
        });
        successCount++;
      } catch (err : any) {
        // DISINI KITA TAHU KENAPA GAGAL
        console.error(`❌ Gagal memasukkan ${row['NAMA']}:`, err.message);
      }
    }

    console.log(`\n🎉 SELESAI!`);
    console.log(`✅ Berhasil: ${successCount} anggota`);
    console.log(`❌ Gagal: ${allData.length - successCount} anggota`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error Fatal:', error);
    process.exit(1);
  }
}

main();