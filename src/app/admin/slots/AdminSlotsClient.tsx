"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Plus, Trash, Edit } from 'lucide-react';

interface Trek {
  id: string;
  name: string;
  slug: string;
}
interface Slot {
  id: string;
  trek_slug: string;
  date: string;
  capacity: number;
  booked: number;
  status: string;
}

export default function AdminSlotsClient() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTrek, setSelectedTrek] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ date: string; capacity: number }>({ date: '', capacity: 10 });
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [message, setMessage] = useState('');

  // Fetch all treks (directly from treks table)
  useEffect(() => {
    fetch('/api/slots/treks')
      .then(res => res.json())
      .then(data => {
        setTreks(data.treks || []);
        if (data.treks && data.treks.length > 0) setSelectedTrek(data.treks[0].slug);
      });
  }, []);

  // Fetch slots for selected trek
  useEffect(() => {
    if (!selectedTrek) return;
    setLoading(true);
    fetch(`/api/slots?trek_slug=${selectedTrek}`)
      .then(res => res.json())
      .then(data => setSlots(data.slots || []))
      .finally(() => setLoading(false));
  }, [selectedTrek, message]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trek_slug: selectedTrek, date: form.date, capacity: form.capacity })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Slot created!');
      setForm({ date: '', capacity: 10 });
    } else {
      setMessage(data.error || 'Failed to create slot');
    }
  };

  const handleEdit = (slot: Slot) => {
    setEditingSlot(slot);
    setForm({ date: slot.date, capacity: slot.capacity });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    setMessage('');
    const res = await fetch(`/api/slots?id=${editingSlot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: form.date, capacity: form.capacity })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Slot updated!');
      setEditingSlot(null);
      setForm({ date: '', capacity: 10 });
    } else {
      setMessage(data.error || 'Failed to update slot');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this slot?')) return;
    setMessage('');
    const res = await fetch(`/api/slots?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      setMessage('Slot deleted!');
    } else {
      setMessage(data.error || 'Failed to delete slot');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-foreground flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" /> Trek Slots Management</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Trek</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors mb-4"
            value={selectedTrek}
            onChange={e => setSelectedTrek(e.target.value)}
          >
            {treks.map(trek => (
              <option key={trek.id} value={trek.slug}>{trek.name}</option>
            ))}
          </select>
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingSlot ? 'Edit Slot' : 'Create New Slot'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingSlot ? handleUpdate : handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="number"
              value={form.capacity}
              min={1}
              onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))}
              required
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
              placeholder="Capacity"
            />
            <Button type="submit" className="gap-2">{editingSlot ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingSlot ? 'Update' : 'Create'}</Button>
            {editingSlot && <Button type="button" variant="outline" onClick={() => { setEditingSlot(null); setForm({ date: '', capacity: 10 }); }}>Cancel</Button>}
          </form>
          {message && <div className="mt-4 text-primary font-medium">{message}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Slots for {treks.find(t => t.id === selectedTrek)?.name || ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="text-muted-foreground">No slots found for this trek.</div>
          ) : (
            <table className="w-full text-left border-collapse mt-2">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Capacity</th>
                  <th className="py-2 px-2">Booked</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id} className="border-b border-border hover:bg-primary/10 transition-colors">
                    <td className="py-2 px-2 font-mono">{slot.date}</td>
                    <td className="py-2 px-2">{slot.capacity}</td>
                    <td className="py-2 px-2">{slot.booked}</td>
                    <td className="py-2 px-2">{slot.status}</td>
                    <td className="py-2 px-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(slot)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(slot.id)}><Trash className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 