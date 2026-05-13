'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation'; // <-- Tambahkan ini
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateCustomCommittee } from '@/lib/actions/committee';
import { Plus, Trash, Wand2 } from 'lucide-react';

export function BuilderClientForm({ eventId }: { eventId: string }) {
  const router = useRouter(); // <-- Inisialisasi router
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState([{ name: '', count: 1 }]);

  const addField = () => setFields([...fields, { name: '', count: 1 }]);
  const removeField = (index: number) => setFields(fields.filter((_, i) => i !== index));
  const updateField = (index: number, key: 'name' | 'count', value: string | number) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const validFields = fields.filter(f => f.name.trim() !== '' && f.count > 0);
      if (validFields.length > 0) {
        const res = await generateCustomCommittee(eventId, validFields);
        if (res.success) {
          router.refresh(); // <-- Paksa halaman untuk ambil data terbaru
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border p-6 rounded-2xl bg-card/40 backdrop-blur-xl shadow-lg space-y-6">
      <h3 className="font-bold text-lg">Kebutuhan Seksi</h3>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input 
              placeholder="Nama Seksi" 
              value={field.name}
              onChange={(e) => updateField(index, 'name', e.target.value)}
              required
            />
            <Input 
              type="number" 
              min="1"
              value={field.count}
              onChange={(e) => updateField(index, 'count', parseInt(e.target.value) || 1)}
              required
              className="w-20"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index)} disabled={fields.length === 1}>
              <Trash className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addField} className="flex-1">
          <Plus className="w-4 h-4 mr-2" /> Seksi
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          <Wand2 className="w-4 h-4 mr-2" /> {isPending ? 'Proses...' : 'Generate'}
        </Button>
      </div>
    </form>
  );
}