import React, { useState } from 'react';
import CourseSelector from '../components/CourseSelector';
import ScheduleList from '../components/ScheduleList';
import { Card } from '@/components/ui/card';

export default function Home() {
  // hold search results here
  const [events, setEvents] = useState({});

  return (
    <Card className="max-w-xl mx-auto mt-8 p-6">
      <h2 className="text-2xl font-semibold mb-4">Plan Your Semester</h2>

      {/* pass setter into CourseSelector */}
      <CourseSelector onResults={setEvents} />

      {/* render schedule when results arrive */}
      {Object.keys(events).length > 0 && (
        <ScheduleList events={events} />
      )}
    </Card>
  );
}