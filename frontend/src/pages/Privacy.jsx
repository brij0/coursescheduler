import { Card } from '@/components/ui/card';

export default function Privacy() {
  return (
    <Card className="max-w-2xl mx-auto mt-8 p-6">
      <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
      <p className="text-gray-700 mb-2">
        We respect your privacy. All data stays on our servers and is never shared.
      </p>
      <p className="text-gray-700">
        For details, contact admin@coursescheduler.local.
      </p>
    </Card>
  );
}