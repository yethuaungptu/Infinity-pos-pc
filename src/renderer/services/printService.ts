// Print Service - Handles receipt printing and document generation
// Supports thermal printers, PDF generation, and various print formats

import { Transaction, Customer } from '../types/core';

export interface PrinterSettings {
  type: 'thermal' | 'laser' | 'pdf';
  name: string;
  ipAddress?: string;
  port?: number;
  paperWidth: 58 | 80; // mm
  charactersPerLine: number;
  printLogo: boolean;
  autoOpenDrawer: boolean;
  copies: number;
}

export interface ReceiptData {
  store: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    taxId?: string;
    logo?: string; // Base64 image data
  };
  transaction: Transaction;
  customer?: Customer;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  payment: {
    method: string;
    paidAmount: number;
    balanceAmount: number;
    dueDate?: Date;
  };
  footer?: string;
  timestamp: Date;
  isReprint?: boolean;
  reprintedBy?: string;
  reprintTime?: Date;
}

export interface ReportData {
  title: string;
  period: string;
  generatedBy: string;
  generatedAt: Date;
  data: any;
  format: 'summary' | 'detailed' | 'chart';
}

export class PrintService {
  private settings: PrinterSettings = {
    type: 'thermal',
    name: 'Default Thermal Printer',
    ipAddress: '192.168.1.100',
    port: 9100,
    paperWidth: 58,
    charactersPerLine: 32,
    printLogo: true,
    autoOpenDrawer: true,
    copies: 1,
  };

  // Update printer settings
  updateSettings(newSettings: Partial<PrinterSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Printer settings updated:', this.settings);
  }

  // Get current printer settings
  getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  // Test printer connection
  async testPrinter(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.settings.type === 'thermal' && this.settings.ipAddress) {
        // Test thermal printer connection
        return await this.testThermalPrinter();
      } else if (this.settings.type === 'pdf') {
        // PDF generation test
        return { success: true, message: 'PDF printer ready' };
      } else {
        // System printer test
        return await this.testSystemPrinter();
      }
    } catch (error: any) {
      console.error('Printer test failed:', error);
      return {
        success: false,
        message: `Printer test failed: ${error.message}`,
      };
    }
  }

  // Print receipt
  async printReceipt(receiptData: ReceiptData): Promise<void> {
    try {
      console.log('Printing receipt:', receiptData.transaction.receiptNumber);

      switch (this.settings.type) {
        case 'thermal':
          await this.printThermalReceipt(receiptData);
          break;
        case 'pdf':
          await this.generatePDFReceipt(receiptData);
          break;
        case 'laser':
          await this.printLaserReceipt(receiptData);
          break;
        default:
          throw new Error('Unknown printer type');
      }

      // Open cash drawer if enabled and it's a cash transaction
      if (
        this.settings.autoOpenDrawer &&
        receiptData.payment.method === 'cash'
      ) {
        await this.openCashDrawer();
      }
    } catch (error: any) {
      console.error('Receipt printing failed:', error);
      throw new Error(`Receipt printing failed: ${error.message}`);
    }
  }

  // Print thermal receipt
  private async printThermalReceipt(receiptData: ReceiptData): Promise<void> {
    try {
      const commands = this.generateThermalCommands(receiptData);

      if (this.settings.ipAddress) {
        // Network thermal printer
        await this.sendToNetworkPrinter(commands);
      } else {
        // USB/Serial thermal printer
        await this.sendToUSBPrinter(commands);
      }

      console.log('Thermal receipt printed successfully');
    } catch (error) {
      console.error('Thermal printing failed:', error);
      throw error;
    }
  }

  // Generate thermal printer commands (ESC/POS)
  private generateThermalCommands(receiptData: ReceiptData): Uint8Array {
    const commands: number[] = [];
    const { charactersPerLine } = this.settings;

    // Initialize printer
    commands.push(...[0x1b, 0x40]); // ESC @ - Initialize

    // Print logo if enabled
    if (this.settings.printLogo && receiptData.store.logo) {
      commands.push(...this.generateLogoCommands(receiptData.store.logo));
    }

    // Store header
    commands.push(
      ...this.centerText(receiptData.store.name, charactersPerLine),
    );
    commands.push(...[0x0a]); // Line feed

    if (receiptData.store.address) {
      commands.push(
        ...this.centerText(receiptData.store.address, charactersPerLine),
      );
      commands.push(...[0x0a]);
    }

    if (receiptData.store.phone) {
      commands.push(
        ...this.centerText(receiptData.store.phone, charactersPerLine),
      );
      commands.push(...[0x0a]);
    }

    // Separator line
    commands.push(...this.textToBytes('-'.repeat(charactersPerLine)));
    commands.push(...[0x0a]);

    // Receipt header
    commands.push(...[0x1b, 0x21, 0x08]); // ESC ! - Bold
    commands.push(...this.textToBytes('RECEIPT'));
    commands.push(...[0x1b, 0x21, 0x00]); // ESC ! - Normal
    commands.push(...[0x0a]);

    // Receipt details
    commands.push(
      ...this.textToBytes(
        `Receipt #: ${receiptData.transaction.receiptNumber}`,
      ),
    );
    commands.push(...[0x0a]);
    commands.push(
      ...this.textToBytes(
        `Date: ${receiptData.timestamp.toLocaleDateString()}`,
      ),
    );
    commands.push(...[0x0a]);
    commands.push(
      ...this.textToBytes(
        `Time: ${receiptData.timestamp.toLocaleTimeString()}`,
      ),
    );
    commands.push(...[0x0a]);

    // Customer info
    if (receiptData.customer) {
      commands.push(
        ...this.textToBytes(
          `Customer: ${receiptData.customer.businessName || receiptData.customer.contactPerson}`,
        ),
      );
      commands.push(...[0x0a]);

      if (receiptData.customer.type === 'farmer') {
        commands.push(...this.textToBytes('Customer Type: FARMER'));
        commands.push(...[0x0a]);
      }
    }

    commands.push(...this.textToBytes('-'.repeat(charactersPerLine)));
    commands.push(...[0x0a]);

    // Items
    commands.push(...[0x1b, 0x21, 0x08]); // Bold
    commands.push(...this.textToBytes('ITEMS'));
    commands.push(...[0x1b, 0x21, 0x00]); // Normal
    commands.push(...[0x0a]);

    for (const item of receiptData.items) {
      // Item name
      commands.push(
        ...this.textToBytes(this.truncateText(item.name, charactersPerLine)),
      );
      commands.push(...[0x0a]);

      // Quantity, price, total
      const qtyLine = `${item.quantity} ${item.unit} @ $${item.price.toFixed(2)}`;
      const totalText = `$${item.total.toFixed(2)}`;
      const spacesNeeded =
        charactersPerLine - qtyLine.length - totalText.length;
      const itemLine =
        qtyLine + ' '.repeat(Math.max(0, spacesNeeded)) + totalText;

      commands.push(...this.textToBytes(itemLine));
      commands.push(...[0x0a]);
    }

    commands.push(...this.textToBytes('-'.repeat(charactersPerLine)));
    commands.push(...[0x0a]);

    // Totals
    commands.push(
      ...this.rightAlignText(
        `Subtotal: $${receiptData.totals.subtotal.toFixed(2)}`,
        charactersPerLine,
      ),
    );
    commands.push(...[0x0a]);

    if (receiptData.totals.discount > 0) {
      commands.push(
        ...this.rightAlignText(
          `Discount: -$${receiptData.totals.discount.toFixed(2)}`,
          charactersPerLine,
        ),
      );
      commands.push(...[0x0a]);
    }

    commands.push(
      ...this.rightAlignText(
        `Tax: $${receiptData.totals.tax.toFixed(2)}`,
        charactersPerLine,
      ),
    );
    commands.push(...[0x0a]);

    // Total (bold)
    commands.push(...[0x1b, 0x21, 0x08]); // Bold
    commands.push(
      ...this.rightAlignText(
        `TOTAL: $${receiptData.totals.total.toFixed(2)}`,
        charactersPerLine,
      ),
    );
    commands.push(...[0x1b, 0x21, 0x00]); // Normal
    commands.push(...[0x0a]);

    commands.push(...this.textToBytes('-'.repeat(charactersPerLine)));
    commands.push(...[0x0a]);

    // Payment info
    commands.push(
      ...this.textToBytes(
        `Payment: ${receiptData.payment.method.toUpperCase()}`,
      ),
    );
    commands.push(...[0x0a]);

    if (receiptData.payment.method === 'credit') {
      commands.push(
        ...this.textToBytes(
          `Amount Due: $${receiptData.payment.balanceAmount.toFixed(2)}`,
        ),
      );
      commands.push(...[0x0a]);

      if (receiptData.payment.dueDate) {
        commands.push(
          ...this.textToBytes(
            `Due Date: ${receiptData.payment.dueDate.toLocaleDateString()}`,
          ),
        );
        commands.push(...[0x0a]);
      }
    } else {
      commands.push(
        ...this.textToBytes(
          `Paid: $${receiptData.payment.paidAmount.toFixed(2)}`,
        ),
      );
      commands.push(...[0x0a]);
    }

    // Footer
    if (receiptData.footer) {
      commands.push(...[0x0a]);
      commands.push(...this.centerText(receiptData.footer, charactersPerLine));
      commands.push(...[0x0a]);
    }

    // Reprint indicator
    if (receiptData.isReprint) {
      commands.push(...[0x0a]);
      commands.push(...this.centerText('*** REPRINT ***', charactersPerLine));
      commands.push(...[0x0a]);

      if (receiptData.reprintTime) {
        commands.push(
          ...this.centerText(
            `Reprinted: ${receiptData.reprintTime.toLocaleString()}`,
            charactersPerLine,
          ),
        );
        commands.push(...[0x0a]);
      }
    }

    // Cut paper
    commands.push(...[0x0a, 0x0a, 0x0a]); // Extra line feeds
    commands.push(...[0x1d, 0x56, 0x00]); // GS V - Full cut

    return new Uint8Array(commands);
  }

  // Generate PDF receipt
  private async generatePDFReceipt(receiptData: ReceiptData): Promise<void> {
    try {
      // In a real implementation, this would use a PDF library like jsPDF
      console.log('Generating PDF receipt...');

      const pdfContent = this.generatePDFContent(receiptData);

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${receiptData.transaction.receiptNumber}.pdf`;
      a.click();

      URL.revokeObjectURL(url);

      console.log('PDF receipt generated successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }

  // Print report
  async printReport(reportData: ReportData): Promise<void> {
    try {
      console.log('Printing report:', reportData.title);

      switch (this.settings.type) {
        case 'thermal':
          await this.printThermalReport(reportData);
          break;
        case 'pdf':
          await this.generatePDFReport(reportData);
          break;
        case 'laser':
          await this.printLaserReport(reportData);
          break;
        default:
          throw new Error('Unknown printer type');
      }
    } catch (error: any) {
      console.error('Report printing failed:', error);
      throw new Error(`Report printing failed: ${error.message}`);
    }
  }

  // Print barcode/QR code
  async printBarcode(
    data: string,
    type: 'code128' | 'qr' = 'code128',
  ): Promise<void> {
    try {
      if (this.settings.type !== 'thermal') {
        throw new Error('Barcode printing only supported on thermal printers');
      }

      const commands = this.generateBarcodeCommands(data, type);

      if (this.settings.ipAddress) {
        await this.sendToNetworkPrinter(commands);
      } else {
        await this.sendToUSBPrinter(commands);
      }

      console.log(`${type} barcode printed: ${data}`);
    } catch (error) {
      console.error('Barcode printing failed:', error);
      throw error;
    }
  }

  // Open cash drawer
  private async openCashDrawer(): Promise<void> {
    try {
      // ESC/POS command to open cash drawer
      const drawerCommands = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

      if (this.settings.ipAddress) {
        await this.sendToNetworkPrinter(drawerCommands);
      } else {
        await this.sendToUSBPrinter(drawerCommands);
      }

      console.log('Cash drawer opened');
    } catch (error) {
      console.error('Failed to open cash drawer:', error);
    }
  }

  // Helper methods for thermal printing
  private textToBytes(text: string): number[] {
    return Array.from(new TextEncoder().encode(text));
  }

  private centerText(text: string, width: number): number[] {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    const centeredText = ' '.repeat(padding) + text;
    return this.textToBytes(centeredText);
  }

  private rightAlignText(text: string, width: number): number[] {
    const padding = Math.max(0, width - text.length);
    const rightAlignedText = ' '.repeat(padding) + text;
    return this.textToBytes(rightAlignedText);
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + '...'
      : text;
  }

  private generateLogoCommands(logoBase64: string): number[] {
    // Simplified logo implementation
    // In reality, this would convert the base64 image to ESC/POS bitmap commands
    return this.textToBytes('[ STORE LOGO ]\n');
  }

  private generateBarcodeCommands(
    data: string,
    type: 'code128' | 'qr',
  ): Uint8Array {
    const commands: number[] = [];

    if (type === 'code128') {
      // Code 128 barcode commands
      commands.push(...[0x1d, 0x6b, 0x49]); // GS k I - Code 128
      commands.push(data.length); // Data length
      commands.push(...this.textToBytes(data));
    } else if (type === 'qr') {
      // QR code commands
      commands.push(...[0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]); // Set QR model
      commands.push(...[0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x08]); // Set size
      commands.push(
        ...[0x1d, 0x28, 0x6b, data.length + 3, 0x00, 0x31, 0x50, 0x30],
      ); // Store data
      commands.push(...this.textToBytes(data));
      commands.push(...[0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]); // Print
    }

    return new Uint8Array(commands);
  }

  // Network communication methods
  private async sendToNetworkPrinter(commands: Uint8Array): Promise<void> {
    // In Electron, this would use net module to connect to printer
    console.log('Sending to network printer:', this.settings.ipAddress);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async sendToUSBPrinter(commands: Uint8Array): Promise<void> {
    // In Electron, this would use serial/USB communication
    console.log('Sending to USB printer');

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async testThermalPrinter(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const testCommands = new Uint8Array([
        0x1b,
        0x40, // Initialize
        ...this.textToBytes('PRINTER TEST\n'),
        ...this.textToBytes('Connection OK\n'),
        0x0a,
        0x0a,
        0x0a, // Line feeds
      ]);

      if (this.settings.ipAddress) {
        await this.sendToNetworkPrinter(testCommands);
      } else {
        await this.sendToUSBPrinter(testCommands);
      }

      return { success: true, message: 'Thermal printer test successful' };
    } catch (error: any) {
      return {
        success: false,
        message: `Thermal printer test failed: ${error.message}`,
      };
    }
  }

  private async testSystemPrinter(): Promise<{
    success: boolean;
    message: string;
  }> {
    // Test system printer (would use browser's print API)
    try {
      console.log('Testing system printer...');
      return { success: true, message: 'System printer ready' };
    } catch (error: any) {
      return {
        success: false,
        message: `System printer test failed: ${error.message}`,
      };
    }
  }

  private generatePDFContent(receiptData: ReceiptData): string {
    // Simplified PDF content generation
    // In reality, would use jsPDF or similar library
    return `PDF Receipt Content for ${receiptData.transaction.receiptNumber}`;
  }

  private async printLaserReceipt(receiptData: ReceiptData): Promise<void> {
    // Implementation for laser/inkjet printers
    console.log('Printing laser receipt...');
  }

  private async printThermalReport(reportData: ReportData): Promise<void> {
    // Implementation for thermal report printing
    console.log('Printing thermal report...');
  }

  private async generatePDFReport(reportData: ReportData): Promise<void> {
    // Implementation for PDF report generation
    console.log('Generating PDF report...');
  }

  private async printLaserReport(reportData: ReportData): Promise<void> {
    // Implementation for laser report printing
    console.log('Printing laser report...');
  }

  // Get available printers
  async getAvailablePrinters(): Promise<string[]> {
    try {
      // In Electron, this would query system printers
      return [
        'Default Thermal Printer',
        'System Default Printer',
        'PDF Printer',
      ];
    } catch (error) {
      console.error('Failed to get printers:', error);
      return [];
    }
  }

  // Print queue management
  private printQueue: Array<{
    id: string;
    data: any;
    type: string;
    timestamp: Date;
  }> = [];

  addToPrintQueue(data: any, type: 'receipt' | 'report' | 'barcode'): string {
    const jobId = `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.printQueue.push({
      id: jobId,
      data,
      type,
      timestamp: new Date(),
    });

    console.log(`Added to print queue: ${jobId}`);
    return jobId;
  }

  async processPrintQueue(): Promise<void> {
    while (this.printQueue.length > 0) {
      const job = this.printQueue.shift();
      if (!job) continue;

      try {
        switch (job.type) {
          case 'receipt':
            await this.printReceipt(job.data);
            break;
          case 'report':
            await this.printReport(job.data);
            break;
          case 'barcode':
            await this.printBarcode(job.data.text, job.data.type);
            break;
        }

        console.log(`Print job completed: ${job.id}`);
      } catch (error) {
        console.error(`Print job failed: ${job.id}`, error);
      }
    }
  }

  getPrintQueueStatus(): {
    pending: number;
    jobs: Array<{ id: string; type: string; timestamp: Date }>;
  } {
    return {
      pending: this.printQueue.length,
      jobs: this.printQueue.map((job) => ({
        id: job.id,
        type: job.type,
        timestamp: job.timestamp,
      })),
    };
  }
}

// Export singleton instance
export const printService = new PrintService();
