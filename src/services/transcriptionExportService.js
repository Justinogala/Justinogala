
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { generateFileName, formatDuration } from '@/utils/transcriptionExportUtils';
import { format } from 'date-fns';

/**
 * Enhanced export service supporting PDF and Word.
 * Includes speaker labels, timestamps, and confidence scores.
 */
export const transcriptionExportService = {
  
  exportToPDF: async (transcription) => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 20;

      // Helper for page breaks
      const checkPageBreak = (height = 10) => {
        if (yPos + height > 280) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title & Header
      doc.setFontSize(22);
      doc.text(transcription.title || 'Untitled Transcription', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateStr = transcription.date ? format(new Date(transcription.date), 'PPP p') : 'Unknown Date';
      doc.text(`Date: ${dateStr} | Duration: ${formatDuration(transcription.duration)}`, margin, yPos);
      yPos += 5;
      
      doc.setDrawColor(200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Content
      doc.setFontSize(11);
      doc.setTextColor(0);

      // Check if we have structured utterances (speaker labels)
      const utterances = transcription.utterances || [];
      const hasUtterances = utterances.length > 0;

      if (hasUtterances) {
        utterances.forEach((utt) => {
          checkPageBreak(15);
          
          // Speaker Header
          doc.setFont(undefined, 'bold');
          doc.setTextColor(50, 50, 150);
          const speaker = `Speaker ${utt.speaker || 'Unknown'}`;
          const time = `${formatDuration(utt.start / 1000)} - ${formatDuration(utt.end / 1000)}`;
          doc.text(`${speaker} [${time}]`, margin, yPos);
          yPos += 6;

          // Text
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0);
          const splitText = doc.splitTextToSize(utt.text, contentWidth);
          
          splitText.forEach(line => {
            checkPageBreak(6);
            doc.text(line, margin, yPos);
            yPos += 6;
          });
          yPos += 4; // Spacing between speakers
        });
      } else {
        // Fallback to raw text
        const text = transcription.text || transcription.content || '';
        const splitText = doc.splitTextToSize(text, contentWidth);
        splitText.forEach(line => {
          checkPageBreak(7);
          doc.text(line, margin, yPos);
          yPos += 7;
        });
      }

      const fileName = `${generateFileName(transcription.title, transcription.date)}.pdf`;
      doc.save(fileName);
      return { success: true, fileName };
    } catch (error) {
      console.error('PDF Export Error:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  exportToWord: async (transcription) => {
    try {
      const utterances = transcription.utterances || [];
      const children = [];

      // Header
      children.push(
        new Paragraph({
          text: transcription.title || 'Untitled',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Date: ${transcription.date ? format(new Date(transcription.date), 'PPP') : 'Unknown'}`,
              color: "666666",
              size: 20
            }),
            new TextRun({
              text: ` | Duration: ${formatDuration(transcription.duration)}`,
              color: "666666",
              size: 20
            })
          ],
          spacing: { after: 400 }
        })
      );

      // Content
      if (utterances.length > 0) {
        utterances.forEach(utt => {
          // Speaker Label
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Speaker ${utt.speaker || 'Unknown'} `,
                  bold: true,
                  color: "2E2E99"
                }),
                new TextRun({
                  text: `[${formatDuration(utt.start / 1000)} - ${formatDuration(utt.end / 1000)}]`,
                  color: "888888",
                  size: 20
                })
              ],
              spacing: { before: 200, after: 100 }
            })
          );
          // Text
          children.push(
            new Paragraph({
              text: utt.text,
              spacing: { after: 200 }
            })
          );
        });
      } else {
        children.push(
          new Paragraph({
            text: transcription.text || '',
            spacing: { line: 360 }
          })
        );
      }

      const doc = new Document({
        sections: [{ properties: {}, children: children }]
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${generateFileName(transcription.title, transcription.date)}.docx`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, fileName };
    } catch (error) {
      console.error('Word Export Error:', error);
      throw new Error('Failed to generate Word document');
    }
  }
};
