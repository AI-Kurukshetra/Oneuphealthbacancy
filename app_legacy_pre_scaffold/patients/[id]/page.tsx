import { PatientAggregate } from "@/components/patient-aggregate";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientAggregate patientId={id} />;
}
