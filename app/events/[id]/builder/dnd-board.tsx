'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, GripVertical } from 'lucide-react';
import { moveCommitteeMember } from '@/lib/actions/committee';

type Member = { memberId: string; memberName: string; sectionName: string };

export function InteractiveBoard({ eventId, initialData, sections }: { eventId: string; initialData: Member[]; sections: string[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState(initialData);

  // Mencegah hydration error di Next.js
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Jika digeser ke luar kotak, batalkan
    if (!destination) return;

    // Jika digeser ke tempat yang sama, batalkan
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceSection = source.droppableId;
    const destSection = destination.droppableId;

    // Optimistic UI Update (Geser di UI dulu biar instan)
    const newData = Array.from(data);
    const draggedMemberIndex = newData.findIndex(m => m.memberId === draggableId);
    
    if (draggedMemberIndex !== -1) {
      newData[draggedMemberIndex].sectionName = destSection;
      setData([...newData]);

      // Update ke Database Neon di Background
      await moveCommitteeMember(eventId, draggableId, destSection);
    }
  };

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="columns-1 md:columns-2 gap-6 space-y-6">
        {sections.map((section) => {
          const membersInSection = data.filter(m => m.sectionName === section);

          return (
            <div key={section} className="break-inside-avoid">
              <Droppable droppableId={section}>
                {(provided, snapshot) => (
                  <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`border-border/40 backdrop-blur-md transition-all group overflow-hidden ${snapshot.isDraggingOver ? 'bg-primary/5 border-primary/50 ring-2 ring-primary/20' : 'bg-card/30 hover:border-primary/50'}`}
                  >
                    <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${snapshot.isDraggingOver ? 'text-primary' : 'text-green-500'}`} />
                          {section}
                        </CardTitle>
                        <Badge variant="outline" className="bg-background/50 font-black">
                          {membersInSection.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 px-4 pb-4 min-h-[100px]">
                      <div className="space-y-2.5">
                        {membersInSection.map((m, index) => (
                          <Draggable key={m.memberId} draggableId={m.memberId} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${snapshot.isDragging ? 'bg-background shadow-xl border-primary/50 scale-105 z-50' : 'bg-background/50 border-border/40 hover:bg-background hover:border-primary/30'}`}
                                style={provided.draggableProps.style}
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                                  <span className="font-semibold text-sm">{m.memberName}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}