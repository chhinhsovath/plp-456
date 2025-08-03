import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ObservationDetailClient from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ObservationDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch the observation data on the server
  const observation = await prisma.inspectionSession.findUnique({
    where: { id },
    include: {
      evaluationRecords: {
        include: {
          field: true
        }
      },
      studentAssessmentSessions: {
        include: {
          subjects: {
            orderBy: { subjectOrder: 'asc' }
          },
          students: {
            orderBy: { studentOrder: 'asc' }
          },
          scores: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  if (!observation) {
    notFound();
  }

  // Convert dates to ISO strings for client component
  const serializedObservation = JSON.parse(JSON.stringify(observation));

  return <ObservationDetailClient initialData={serializedObservation} />;
}