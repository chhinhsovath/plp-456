import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { parse } from 'json2csv';

// Add Khmer font support for PDF
import '@/lib/fonts/khmer-font';
import { formatDateForDisplay, formatDateTimeForDisplay } from '@/lib/date-utils';

interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  filename: string;
  title?: string;
  metadata?: Record<string, any>;
}

export class ExportService {
  // Export mentoring session data
  static async exportSessions(sessions: any[], options: ExportOptions) {
    switch (options.format) {
      case 'excel':
        return this.exportSessionsToExcel(sessions, options);
      case 'pdf':
        return this.exportSessionsToPDF(sessions, options);
      case 'csv':
        return this.exportSessionsToCSV(sessions, options);
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Export progress reports
  static async exportProgressReports(reports: any[], options: ExportOptions) {
    switch (options.format) {
      case 'excel':
        return this.exportProgressReportsToExcel(reports, options);
      case 'pdf':
        return this.exportProgressReportsToPDF(reports, options);
      default:
        throw new Error('Unsupported format for progress reports');
    }
  }

  // Export observations
  static async exportObservations(observations: any[], options: ExportOptions) {
    switch (options.format) {
      case 'excel':
        return this.exportObservationsToExcel(observations, options);
      case 'pdf':
        return this.exportObservationsToPDF(observations, options);
      default:
        throw new Error('Unsupported format for observations');
    }
  }

  // Export feedback
  static async exportFeedback(feedback: any[], options: ExportOptions) {
    switch (options.format) {
      case 'excel':
        return this.exportFeedbackToExcel(feedback, options);
      case 'pdf':
        return this.exportFeedbackToPDF(feedback, options);
      default:
        throw new Error('Unsupported format for feedback');
    }
  }

  // Excel export for sessions
  private static async exportSessionsToExcel(sessions: any[], options: ExportOptions) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PLP Mentoring System';
    workbook.created = new Date();

    // Main sheet - Sessions
    const sessionsSheet = workbook.addWorksheet('វគ្គណែនាំ');
    
    // Define columns
    sessionsSheet.columns = [
      { header: 'កាលបរិច្ឆេទ', key: 'date', width: 15 },
      { header: 'ប្រភេទវគ្គ', key: 'type', width: 20 },
      { header: 'គ្រូណែនាំ', key: 'mentor', width: 20 },
      { header: 'គ្រូកំពុងរៀន', key: 'mentee', width: 20 },
      { header: 'ទីតាំង', key: 'location', width: 25 },
      { header: 'ស្ថានភាព', key: 'status', width: 15 },
      { header: 'រយៈពេល (នាទី)', key: 'duration', width: 15 },
    ];

    // Style header row
    sessionsSheet.getRow(1).font = { bold: true };
    sessionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' },
    };

    // Add data
    sessions.forEach(session => {
      sessionsSheet.addRow({
        date: formatDateForDisplay(session.scheduledDate),
        type: this.getSessionTypeKhmer(session.sessionType),
        mentor: session.relationship.mentor.name,
        mentee: session.relationship.mentee.name,
        location: session.location,
        status: this.getStatusKhmer(session.status),
        duration: session.duration,
      });
    });

    // Observations sheet
    const observationsSheet = workbook.addWorksheet('ការសង្កេត');
    observationsSheet.columns = [
      { header: 'វគ្គ', key: 'session', width: 15 },
      { header: 'ប្រភេទ', key: 'type', width: 20 },
      { header: 'ការសង្កេត', key: 'observation', width: 40 },
      { header: 'ភស្តុតាង', key: 'evidence', width: 30 },
      { header: 'ពេលវេលា', key: 'timestamp', width: 20 },
    ];

    // Add observations
    sessions.forEach(session => {
      session.observations?.forEach((obs: any) => {
        observationsSheet.addRow({
          session: formatDateForDisplay(session.scheduledDate),
          type: obs.observationType,
          observation: obs.observationKm,
          evidence: obs.evidence,
          timestamp: formatDateTimeForDisplay(obs.timestamp),
        });
      });
    });

    // Feedback sheet
    const feedbackSheet = workbook.addWorksheet('មតិយោបល់');
    feedbackSheet.columns = [
      { header: 'វគ្គ', key: 'session', width: 15 },
      { header: 'ប្រភេទ', key: 'type', width: 20 },
      { header: 'មតិយោបល់', key: 'feedback', width: 40 },
      { header: 'អាទិភាព', key: 'priority', width: 15 },
      { header: 'ស្ថានភាព', key: 'addressed', width: 15 },
    ];

    // Add feedback
    sessions.forEach(session => {
      session.feedbackItems?.forEach((feedback: any) => {
        feedbackSheet.addRow({
          session: formatDateForDisplay(session.scheduledDate),
          type: this.getFeedbackTypeKhmer(feedback.feedbackType),
          feedback: feedback.feedbackKm,
          priority: feedback.priority,
          addressed: feedback.isAddressed ? 'បានដោះស្រាយ' : 'មិនទាន់',
        });
      });
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, options.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // PDF export for sessions
  private static async exportSessionsToPDF(sessions: any[], options: ExportOptions) {
    const doc = new jsPDF();
    
    // Set Khmer font
    doc.setFont('KhmerOS');
    
    // Title
    doc.setFontSize(20);
    doc.text(options.title || 'របាយការណ៍វគ្គណែនាំ', 105, 20, { align: 'center' });
    
    // Metadata
    doc.setFontSize(12);
    doc.text(`កាលបរិច្ឆេទ: ${formatDateForDisplay(new Date())}`, 20, 40);
    doc.text(`ចំនួនវគ្គ: ${sessions.length}`, 20, 50);
    
    let yPosition = 70;
    
    // Sessions data
    sessions.forEach((session, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`វគ្គទី ${index + 1}`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`កាលបរិច្ឆេទ: ${formatDateForDisplay(session.scheduledDate)}`, 30, yPosition);
      yPosition += 7;
      doc.text(`ប្រភេទ: ${this.getSessionTypeKhmer(session.sessionType)}`, 30, yPosition);
      yPosition += 7;
      doc.text(`គ្រូណែនាំ: ${session.relationship.mentor.name}`, 30, yPosition);
      yPosition += 7;
      doc.text(`គ្រូកំពុងរៀន: ${session.relationship.mentee.name}`, 30, yPosition);
      yPosition += 7;
      doc.text(`ទីតាំង: ${session.location}`, 30, yPosition);
      yPosition += 7;
      doc.text(`ស្ថានភាព: ${this.getStatusKhmer(session.status)}`, 30, yPosition);
      yPosition += 15;
    });
    
    // Save PDF
    doc.save(options.filename);
  }

  // CSV export for sessions
  private static async exportSessionsToCSV(sessions: any[], options: ExportOptions) {
    const data = sessions.map(session => ({
      Date: formatDateForDisplay(session.scheduledDate),
      Type: this.getSessionTypeKhmer(session.sessionType),
      Mentor: session.relationship.mentor.name,
      Mentee: session.relationship.mentee.name,
      Location: session.location,
      Status: this.getStatusKhmer(session.status),
      Duration: session.duration,
      Observations: session.observations?.length || 0,
      Feedback: session.feedbackItems?.length || 0,
    }));

    const csv = parse(data);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, options.filename, 'text/csv');
  }

  // Excel export for progress reports
  private static async exportProgressReportsToExcel(reports: any[], options: ExportOptions) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PLP Mentoring System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('របាយការណ៍វឌ្ឍនភាព');
    
    sheet.columns = [
      { header: 'កាលបរិច្ឆេទ', key: 'date', width: 15 },
      { header: 'រយៈពេល', key: 'period', width: 15 },
      { header: 'គ្រូណែនាំ', key: 'mentor', width: 20 },
      { header: 'គ្រូកំពុងរៀន', key: 'mentee', width: 20 },
      { header: 'វគ្គបានបញ្ចប់', key: 'sessions', width: 15 },
      { header: 'ការវាយតម្លៃ', key: 'rating', width: 15 },
      { header: 'សមិទ្ធិផល', key: 'achievements', width: 40 },
      { header: 'បញ្ហាប្រឈម', key: 'challenges', width: 40 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' },
    };

    reports.forEach(report => {
      sheet.addRow({
        date: formatDateForDisplay(report.reportDate),
        period: this.getPeriodKhmer(report.reportPeriod),
        mentor: report.relationship.mentor.name,
        mentee: report.relationship.mentee.name,
        sessions: report.progressSummary.sessionsCompleted,
        rating: report.overallRating ? `${report.overallRating}/5` : '-',
        achievements: report.achievements.join(', '),
        challenges: report.challenges.join(', '),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, options.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // PDF export for progress reports
  private static async exportProgressReportsToPDF(reports: any[], options: ExportOptions) {
    const doc = new jsPDF();
    
    doc.setFont('KhmerOS');
    doc.setFontSize(20);
    doc.text(options.title || 'របាយការណ៍វឌ្ឍនភាព', 105, 20, { align: 'center' });
    
    let yPosition = 40;
    
    reports.forEach((report, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`របាយការណ៍ទី ${index + 1}`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`កាលបរិច្ឆេទ: ${formatDateForDisplay(report.reportDate)}`, 30, yPosition);
      yPosition += 7;
      doc.text(`គ្រូណែនាំ: ${report.relationship.mentor.name}`, 30, yPosition);
      yPosition += 7;
      doc.text(`គ្រូកំពុងរៀន: ${report.relationship.mentee.name}`, 30, yPosition);
      yPosition += 7;
      
      if (report.achievements.length > 0) {
        doc.text('សមិទ្ធិផល:', 30, yPosition);
        yPosition += 5;
        report.achievements.forEach((achievement: string) => {
          doc.text(`• ${achievement}`, 35, yPosition);
          yPosition += 5;
        });
      }
      
      yPosition += 10;
    });
    
    doc.save(options.filename);
  }

  // Helper functions
  private static downloadFile(content: Blob | ArrayBuffer, filename: string, mimeType: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private static getSessionTypeKhmer(type: string): string {
    const types: Record<string, string> = {
      CLASSROOM_OBSERVATION: 'ការសង្កេតក្នុងថ្នាក់រៀន',
      LESSON_PLANNING: 'ការគាំទ្រផែនការបង្រៀន',
      REFLECTIVE_PRACTICE: 'ការអនុវត្តឆ្លុះបញ្ចាំង',
      PEER_LEARNING: 'វង់សិក្សាមិត្តភក្តិ',
      FOLLOW_UP: 'ការតាមដានបន្ត',
    };
    return types[type] || type;
  }

  private static getStatusKhmer(status: string): string {
    const statuses: Record<string, string> = {
      SCHEDULED: 'បានកំណត់ពេល',
      IN_PROGRESS: 'កំពុងដំណើរការ',
      COMPLETED: 'បានបញ្ចប់',
      CANCELLED: 'បានលុបចោល',
      RESCHEDULED: 'បានកំណត់ពេលឡើងវិញ',
    };
    return statuses[status] || status;
  }

  private static getFeedbackTypeKhmer(type: string): string {
    const types: Record<string, string> = {
      strength: 'ចំណុចខ្លាំង',
      area_for_improvement: 'ផ្នែកត្រូវកែលម្អ',
      suggestion: 'សំណូមពរ',
    };
    return types[type] || type;
  }

  private static getPeriodKhmer(period: string): string {
    const periods: Record<string, string> = {
      weekly: 'ប្រចាំសប្តាហ៍',
      monthly: 'ប្រចាំខែ',
      quarterly: 'ប្រចាំត្រីមាស',
    };
    return periods[period] || period;
  }

  // Excel export for observations
  private static async exportObservationsToExcel(observations: any[], options: ExportOptions) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PLP Mentoring System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('ការសង្កេត');
    
    sheet.columns = [
      { header: 'កាលបរិច្ឆេទ', key: 'date', width: 15 },
      { header: 'វគ្គ', key: 'session', width: 20 },
      { header: 'ប្រភេទ', key: 'type', width: 20 },
      { header: 'ការសង្កេត', key: 'observation', width: 40 },
      { header: 'ភស្តុតាង', key: 'evidence', width: 30 },
      { header: 'អ្នកសង្កេត', key: 'observer', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' },
    };

    observations.forEach(obs => {
      sheet.addRow({
        date: formatDateForDisplay(obs.timestamp),
        session: obs.session?.sessionType || '-',
        type: obs.observationType,
        observation: obs.observationKm,
        evidence: obs.evidence || '-',
        observer: obs.observer?.name || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, options.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // PDF export for observations
  private static async exportObservationsToPDF(observations: any[], options: ExportOptions) {
    const doc = new jsPDF();
    
    doc.setFont('KhmerOS');
    doc.setFontSize(20);
    doc.text(options.title || 'របាយការណ៍ការសង្កេត', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`កាលបរិច្ឆេទ: ${formatDateForDisplay(new Date())}`, 20, 40);
    doc.text(`ចំនួនការសង្កេត: ${observations.length}`, 20, 50);
    
    let yPosition = 70;
    
    observations.forEach((obs, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`ការសង្កេតទី ${index + 1}`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`កាលបរិច្ឆេទ: ${formatDateForDisplay(obs.timestamp)}`, 30, yPosition);
      yPosition += 7;
      doc.text(`ប្រភេទ: ${obs.observationType}`, 30, yPosition);
      yPosition += 7;
      doc.text(`ការសង្កេត: ${obs.observationKm}`, 30, yPosition);
      yPosition += 7;
      if (obs.evidence) {
        doc.text(`ភស្តុតាង: ${obs.evidence}`, 30, yPosition);
        yPosition += 7;
      }
      yPosition += 10;
    });
    
    doc.save(options.filename);
  }

  // Excel export for feedback
  private static async exportFeedbackToExcel(feedback: any[], options: ExportOptions) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PLP Mentoring System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('មតិយោបល់');
    
    sheet.columns = [
      { header: 'កាលបរិច្ឆេទ', key: 'date', width: 15 },
      { header: 'វគ្គ', key: 'session', width: 20 },
      { header: 'ប្រភេទ', key: 'type', width: 20 },
      { header: 'មតិយោបល់', key: 'feedback', width: 40 },
      { header: 'អាទិភាព', key: 'priority', width: 15 },
      { header: 'ស្ថានភាព', key: 'status', width: 15 },
      { header: 'អ្នកផ្តល់មតិ', key: 'provider', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' },
    };

    feedback.forEach(item => {
      sheet.addRow({
        date: formatDateForDisplay(item.createdAt),
        session: item.session?.sessionType || '-',
        type: this.getFeedbackTypeKhmer(item.feedbackType),
        feedback: item.feedbackKm,
        priority: item.priority || 'មធ្យម',
        status: item.isAddressed ? 'បានដោះស្រាយ' : 'មិនទាន់',
        provider: item.provider?.name || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, options.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // PDF export for feedback
  private static async exportFeedbackToPDF(feedback: any[], options: ExportOptions) {
    const doc = new jsPDF();
    
    doc.setFont('KhmerOS');
    doc.setFontSize(20);
    doc.text(options.title || 'របាយការណ៍មតិយោបល់', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`កាលបរិច្ឆេទ: ${formatDateForDisplay(new Date())}`, 20, 40);
    doc.text(`ចំនួនមតិយោបល់: ${feedback.length}`, 20, 50);
    
    let yPosition = 70;
    
    const feedbackByType = {
      strength: feedback.filter(f => f.feedbackType === 'strength'),
      area_for_improvement: feedback.filter(f => f.feedbackType === 'area_for_improvement'),
      suggestion: feedback.filter(f => f.feedbackType === 'suggestion'),
    };

    Object.entries(feedbackByType).forEach(([type, items]) => {
      if (items.length === 0) return;
      
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(this.getFeedbackTypeKhmer(type), 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      items.forEach((item, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${index + 1}. ${item.feedbackKm}`, 30, yPosition);
        yPosition += 7;
      });
      
      yPosition += 10;
    });
    
    doc.save(options.filename);
  }
}