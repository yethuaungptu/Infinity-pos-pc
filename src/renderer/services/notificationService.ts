// Notification Service - Handles all system notifications and alerts
// Including low stock alerts, payment reminders, quality issues, etc.

import { Product, Customer, Transaction, Staff } from '../types/core';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category:
    | 'inventory'
    | 'sales'
    | 'customer'
    | 'vendor'
    | 'system'
    | 'quality'
    | 'financial';
  actionRequired?: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  recipientIds?: string[]; // Staff member IDs
}

export class NotificationService {
  private notifications: Notification[] = [];
  private subscribers: ((notification: Notification) => void)[] = [];
  private settings = {
    lowStockEnabled: true,
    paymentRemindersEnabled: true,
    qualityAlertsEnabled: true,
    systemAlertsEnabled: true,
    emailNotifications: false,
    soundEnabled: true,
  };

  // Subscribe to notifications
  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  // Send notification
  private async sendNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  ): Promise<Notification> {
    const fullNotification: Notification = {
      id: this.generateNotificationId(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    // Store notification
    this.notifications.unshift(fullNotification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notify subscribers
    this.subscribers.forEach((callback) => {
      try {
        callback(fullNotification);
      } catch (error) {
        console.error('Notification callback failed:', error);
      }
    });

    // Play sound for high priority notifications
    if (
      this.settings.soundEnabled &&
      ['high', 'critical'].includes(notification.priority)
    ) {
      this.playNotificationSound();
    }

    // Send email notification if enabled
    if (
      this.settings.emailNotifications &&
      notification.priority === 'critical'
    ) {
      await this.sendEmailNotification(fullNotification);
    }

    console.log(
      `Notification sent: ${notification.type} - ${notification.title}`,
    );
    return fullNotification;
  }

  // Low stock alert
  async sendLowStockAlert(product: Product): Promise<Notification | null> {
    if (!this.settings.lowStockEnabled) return null;

    const severity = product.stock === 0 ? 'critical' : 'high';
    const message =
      product.stock === 0
        ? `${product.name} is out of stock!`
        : `${product.name} is running low (${product.stock} ${product.unit} remaining)`;

    return await this.sendNotification({
      type: 'warning',
      title: product.stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
      message,
      priority: severity,
      category: 'inventory',
      actionRequired: true,
      actionUrl: `/inventory/products/${product.id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  }

  // Credit limit alert
  async sendCreditLimitAlert(
    customer: Customer,
    utilizationRate: number,
  ): Promise<Notification> {
    const severity: 'medium' | 'high' | 'critical' =
      utilizationRate >= 95
        ? 'critical'
        : utilizationRate >= 85
          ? 'high'
          : 'medium';

    return await this.sendNotification({
      type: 'warning',
      title: 'Credit Limit Warning',
      message: `${customer.businessName || customer.contactPerson} has used ${utilizationRate.toFixed(1)}% of credit limit`,
      priority: severity,
      category: 'customer',
      actionRequired: utilizationRate >= 90,
      actionUrl: `/customers/${customer.id}`,
    });
  }

  // Large transaction alert
  async sendLargeTransactionAlert(
    transaction: Transaction,
  ): Promise<Notification> {
    return await this.sendNotification({
      type: 'info',
      title: 'Large Transaction',
      message: `High-value transaction processed: $${transaction.total.toLocaleString()} (${transaction.receiptNumber})`,
      priority: 'medium',
      category: 'sales',
      actionRequired: false,
      actionUrl: `/reports/transactions/${transaction.id}`,
    });
  }

  // Payment due alert
  async sendPaymentDueAlert(
    customer: Customer,
    overdueAmount: number,
    daysPastDue: number,
  ): Promise<Notification | null> {
    if (!this.settings.paymentRemindersEnabled) return null;

    const severity: 'medium' | 'high' | 'critical' =
      daysPastDue >= 60 ? 'critical' : daysPastDue >= 30 ? 'high' : 'medium';

    return await this.sendNotification({
      type: 'error',
      title: 'Payment Overdue',
      message: `${customer.businessName || customer.contactPerson} has overdue payment of $${overdueAmount.toLocaleString()} (${daysPastDue} days past due)`,
      priority: severity,
      category: 'financial',
      actionRequired: true,
      actionUrl: `/customers/${customer.id}/payments`,
    });
  }

  // Vendor payment due alert
  async sendVendorPaymentDueAlert(
    vendorName: string,
    amount: number,
    dueDate: Date,
  ): Promise<Notification> {
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );
    const isPastDue = daysUntilDue < 0;

    const severity: 'medium' | 'high' | 'critical' = isPastDue
      ? 'critical'
      : daysUntilDue <= 3
        ? 'high'
        : 'medium';

    return await this.sendNotification({
      type: isPastDue ? 'error' : 'warning',
      title: isPastDue ? 'Payment Overdue' : 'Payment Due Soon',
      message: `Payment to ${vendorName}: $${amount.toLocaleString()} ${
        isPastDue
          ? `overdue by ${Math.abs(daysUntilDue)} days`
          : `due in ${daysUntilDue} days`
      }`,
      priority: severity,
      category: 'vendor',
      actionRequired: true,
      actionUrl: '/vendors/payments',
    });
  }

  // Quality alert for egg collections
  async sendQualityAlert(data: {
    farmerId: string;
    collectionId: string;
    damageRate: number;
    notes?: string;
  }): Promise<Notification | null> {
    if (!this.settings.qualityAlertsEnabled) return null;

    return await this.sendNotification({
      type: 'warning',
      title: 'Quality Issue Detected',
      message: `High damage rate (${(data.damageRate * 100).toFixed(1)}%) in egg collection from Farm ${data.farmerId}`,
      priority: 'high',
      category: 'quality',
      actionRequired: true,
      actionUrl: `/eggs/collections/${data.collectionId}`,
    });
  }

  // Production alert for low egg production
  async sendProductionAlert(data: {
    farmerId: string;
    expected: { hen: number; duck: number };
    actual: { hen: number; duck: number };
  }): Promise<Notification> {
    const henShortfall = data.expected.hen - data.actual.hen;
    const duckShortfall = data.expected.duck - data.actual.duck;

    return await this.sendNotification({
      type: 'warning',
      title: 'Low Production Alert',
      message: `Farm ${data.farmerId} production below expected levels. Hen: -${henShortfall}, Duck: -${duckShortfall}`,
      priority: 'medium',
      category: 'quality',
      actionRequired: false,
      actionUrl: `/customers/${data.farmerId}`,
    });
  }

  // System alert
  async sendSystemAlert(
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  ): Promise<Notification | null> {
    if (!this.settings.systemAlertsEnabled) return null;

    return await this.sendNotification({
      type: severity === 'critical' ? 'error' : 'warning',
      title,
      message,
      priority: severity,
      category: 'system',
      actionRequired: severity === 'critical',
    });
  }

  // Sync status notification
  async sendSyncStatusNotification(
    status: 'started' | 'completed' | 'failed',
    details?: string,
  ): Promise<Notification> {
    const types = {
      started: 'info' as const,
      completed: 'success' as const,
      failed: 'error' as const,
    };

    const messages = {
      started: 'Data synchronization started...',
      completed: `Data synchronization completed successfully${details ? `: ${details}` : ''}`,
      failed: `Data synchronization failed${details ? `: ${details}` : ''}`,
    };

    return await this.sendNotification({
      type: types[status],
      title: 'Data Synchronization',
      message: messages[status],
      priority: status === 'failed' ? 'high' : 'low',
      category: 'system',
      actionRequired: status === 'failed',
    });
  }

  // Staff performance notification
  async sendStaffPerformanceNotification(
    staff: Staff,
    metric: string,
    value: number,
    threshold: number,
  ): Promise<Notification> {
    const isPositive = value >= threshold;

    return await this.sendNotification({
      type: isPositive ? 'success' : 'warning',
      title: `Staff Performance ${isPositive ? 'Achievement' : 'Alert'}`,
      message: `${staff.firstName} ${staff.lastName}: ${metric} is ${value.toFixed(1)} (threshold: ${threshold})`,
      priority: isPositive ? 'low' : 'medium',
      category: 'system',
      actionRequired: !isPositive,
      actionUrl: `/staff/${staff.id}`,
    });
  }

  // Cash flow warning
  async sendCashFlowWarning(
    projectedBalance: number,
    daysAhead: number,
  ): Promise<Notification> {
    const severity: 'medium' | 'high' | 'critical' =
      projectedBalance < 0
        ? 'critical'
        : projectedBalance < 5000
          ? 'high'
          : 'medium';

    return await this.sendNotification({
      type: 'warning',
      title: 'Cash Flow Alert',
      message: `Projected cash balance in ${daysAhead} days: ${projectedBalance < 0 ? '-' : ''}$${Math.abs(projectedBalance).toLocaleString()}`,
      priority: severity,
      category: 'financial',
      actionRequired: severity === 'critical',
      actionUrl: '/financial/cashflow',
    });
  }

  // Get all notifications
  getAllNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter((n) => !n.read);
  }

  // Get notifications by category
  getNotificationsByCategory(
    category: Notification['category'],
  ): Notification[] {
    return this.notifications.filter((n) => n.category === category);
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.read = true;
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }

  // Clear notification
  clearNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(
      (n) => n.id !== notificationId,
    );
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
  }

  // Clear old notifications
  clearOldNotifications(olderThanDays: number = 7): void {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    );
    this.notifications = this.notifications.filter(
      (n) => n.timestamp > cutoffDate,
    );
  }

  // Update settings
  updateSettings(newSettings: Partial<typeof this.settings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Get settings
  getSettings(): typeof this.settings {
    return { ...this.settings };
  }

  // Get notification statistics
  getNotificationStats(): {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byCategory: Record<Notification['category'], number>;
    byPriority: Record<Notification['priority'], number>;
  } {
    const stats = {
      total: this.notifications.length,
      unread: this.getUnreadNotifications().length,
      byType: {} as Record<NotificationType, number>,
      byCategory: {} as Record<Notification['category'], number>,
      byPriority: {} as Record<Notification['priority'], number>,
    };

    this.notifications.forEach((notification) => {
      // By type
      stats.byType[notification.type] =
        (stats.byType[notification.type] || 0) + 1;

      // By category
      stats.byCategory[notification.category] =
        (stats.byCategory[notification.category] || 0) + 1;

      // By priority
      stats.byPriority[notification.priority] =
        (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  }

  // Schedule recurring notifications (for payment reminders, etc.)
  scheduleRecurringNotification(
    interval: 'daily' | 'weekly' | 'monthly',
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  ): string {
    const scheduleId = this.generateNotificationId();

    // In a real implementation, this would use a proper scheduler
    console.log(`Scheduled ${interval} notification:`, notification.title);

    return scheduleId;
  }

  // Cancel scheduled notification
  cancelScheduledNotification(scheduleId: string): void {
    console.log(`Cancelled scheduled notification: ${scheduleId}`);
  }

  // Private methods
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private playNotificationSound(): void {
    if (typeof window !== 'undefined' && window.Audio) {
      try {
        const audio = new Audio();
        // Simple notification beep sound (base64 encoded)
        audio.src =
          'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmccBjiR2e/NeSsFJHfH8N2QQAoUXrTp66hVFApGnt/wvmccBjiR2e/NeSsFJHfH8N2QQAoUXrTp66hVFApGnt/wvmccBjiR2e/NeSsFJHfH8N2QQAoUXrTp66hVFApGnt/wvmccBjiR2e/NeSsFJHfH8N2QQAoUXrTp66hVFApGnt/wvmcc';
        audio.volume = 0.3;
        audio.play().catch((error) => {
          console.warn('Could not play notification sound:', error);
        });
      } catch (error) {
        console.warn('Notification sound failed:', error);
      }
    }
  }

  private async sendEmailNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      // In a real implementation, this would send an actual email
      // via an email service provider (SendGrid, AWS SES, etc.)
      console.log('Email notification would be sent:', {
        subject: notification.title,
        body: notification.message,
        priority: notification.priority,
      });
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  }

  // Bulk operations
  async sendBulkNotifications(
    notifications: Array<Omit<Notification, 'id' | 'timestamp' | 'read'>>,
  ): Promise<Notification[]> {
    const results: Notification[] = [];

    for (const notificationData of notifications) {
      try {
        const notification = await this.sendNotification(notificationData);
        results.push(notification);
      } catch (error) {
        console.error('Failed to send bulk notification:', error);
      }
    }

    return results;
  }

  // Check for automated alerts (called periodically)
  async checkAutomatedAlerts(): Promise<void> {
    try {
      // This would typically be called by a background job
      await this.checkLowStockAlerts();
      await this.checkPaymentDueAlerts();
      await this.checkSystemHealthAlerts();
    } catch (error) {
      console.error('Automated alert check failed:', error);
    }
  }

  private async checkLowStockAlerts(): Promise<void> {
    // Implementation would query database for low stock products
    // This is a simplified version
    console.log('Checking low stock alerts...');
  }

  private async checkPaymentDueAlerts(): Promise<void> {
    // Implementation would query database for overdue payments
    console.log('Checking payment due alerts...');
  }

  private async checkSystemHealthAlerts(): Promise<void> {
    // Check system health metrics
    console.log('Checking system health alerts...');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
