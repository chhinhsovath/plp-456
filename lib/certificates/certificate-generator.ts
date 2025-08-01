import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateData {
  userName: string;
  certificateNo: string;
  templateName: string;
  templateNameKh: string;
  issuedDate: Date;
  achievementData: any;
  verificationCode: string;
}

export class CertificateGenerator {
  static async generatePDF(data: CertificateData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Set background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');

    // Add border
    doc.setDrawColor(24, 144, 255);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    // Add inner border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(24, 144, 255);
    doc.text('CERTIFICATE', 148.5, 50, { align: 'center' });

    // Subtitle in Khmer
    doc.setFontSize(24);
    doc.text(data.templateNameKh, 148.5, 65, { align: 'center' });

    // "This is to certify that"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('This is to certify that', 148.5, 85, { align: 'center' });

    // Recipient name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0);
    doc.text(data.userName, 148.5, 105, { align: 'center' });

    // Achievement text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    const achievementText = this.getAchievementText(data.templateName, data.achievementData);
    const lines = doc.splitTextToSize(achievementText, 240);
    let yPosition = 125;
    lines.forEach((line: string) => {
      doc.text(line, 148.5, yPosition, { align: 'center' });
      yPosition += 8;
    });

    // Date
    doc.setFontSize(12);
    doc.text(`Issued on ${data.issuedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 148.5, yPosition + 10, { align: 'center' });

    // Certificate number and verification
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Certificate No: ${data.certificateNo}`, 30, 185);
    doc.text(`Verification Code: ${data.verificationCode}`, 200, 185);

    // Signature lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(60, 165, 120, 165);
    doc.line(177, 165, 237, 165);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Program Director', 90, 172, { align: 'center' });
    doc.text('Mentor Coordinator', 207, 172, { align: 'center' });

    // Convert to blob
    return doc.output('blob');
  }

  static getAchievementText(templateName: string, achievementData: any): string {
    switch (templateName) {
      case 'Mentoring Program Completion':
        return `has successfully completed the PLP Teacher Mentoring Program with ${achievementData.sessionsCompleted} sessions conducted from ${new Date(achievementData.startDate).toLocaleDateString()} to ${new Date(achievementData.endDate).toLocaleDateString()}.`;
      
      case 'Excellence in Mentoring':
        return `has demonstrated excellence in mentoring with an average rating of ${achievementData.averageRating.toFixed(1)}/5.0 across ${achievementData.totalSessions} mentoring sessions.`;
      
      case 'Peer Observation Leader':
        return `has shown exceptional leadership in peer observation activities, facilitating collaborative learning and professional growth.`;
      
      default:
        return 'has achieved outstanding performance in the PLP Teacher Development Program.';
    }
  }

  static async generateHTML(data: CertificateData): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;700&display=swap');
          
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .certificate {
            width: 297mm;
            height: 210mm;
            padding: 20mm;
            box-sizing: border-box;
            position: relative;
            background: white;
            border: 3px solid #1890ff;
          }
          
          .inner-border {
            position: absolute;
            top: 15mm;
            left: 15mm;
            right: 15mm;
            bottom: 15mm;
            border: 1px solid #1890ff;
          }
          
          .content {
            position: relative;
            z-index: 1;
            text-align: center;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          h1 {
            color: #1890ff;
            font-size: 48px;
            margin: 0;
            font-weight: bold;
          }
          
          .subtitle {
            font-family: 'Noto Sans Khmer', sans-serif;
            font-size: 32px;
            color: #1890ff;
            margin: 10px 0 30px;
          }
          
          .certify {
            font-size: 18px;
            margin: 20px 0;
          }
          
          .recipient {
            font-size: 36px;
            font-weight: bold;
            margin: 20px 0;
          }
          
          .achievement {
            font-size: 16px;
            line-height: 1.6;
            max-width: 80%;
            margin: 20px auto;
          }
          
          .date {
            font-size: 14px;
            margin: 30px 0;
          }
          
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
          }
          
          .signature {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            border-bottom: 2px solid black;
            margin-bottom: 10px;
          }
          
          .footer {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="inner-border"></div>
          <div class="content">
            <h1>CERTIFICATE</h1>
            <div class="subtitle">${data.templateNameKh}</div>
            <div class="certify">This is to certify that</div>
            <div class="recipient">${data.userName}</div>
            <div class="achievement">${this.getAchievementText(data.templateName, data.achievementData)}</div>
            <div class="date">Issued on ${data.issuedDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div>Program Director</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Mentor Coordinator</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <span>Certificate No: ${data.certificateNo}</span>
            <span>Verification Code: ${data.verificationCode}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}