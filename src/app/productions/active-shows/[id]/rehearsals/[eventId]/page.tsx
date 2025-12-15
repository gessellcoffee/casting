import { redirect } from 'next/navigation';

export default async function RehearsalEventLegacyRedirectPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
  redirect(`/productions/active-shows/${id}/scheduling/rehearsals/${eventId}`);
}
