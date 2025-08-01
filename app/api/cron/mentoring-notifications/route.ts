import { NextRequest, NextResponse } from 'next/server';
import { MentoringNotificationService } from '@/lib/notifications/mentoring-notifications';

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by a cron job or admin
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run notification checks
    await Promise.all([
      MentoringNotificationService.checkAndSendSessionReminders(),
      MentoringNotificationService.checkProgressReportsDue(),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications checked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in mentoring notifications cron:', error);
    return NextResponse.json(
      { error: 'Failed to run notification checks' },
      { status: 500 }
    );
  }
}