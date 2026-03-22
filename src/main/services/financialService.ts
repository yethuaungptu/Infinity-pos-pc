import { databaseService } from '../database';

type Period = 'weekly' | 'monthly';

interface FinancialSummary {
  period: Period;
  startDate: Date;
  endDate: Date;
  revenue: {
    farmerSales: number;
    regularSales: number;
    eggSales: number;
    total: number;
  };
  costs: {
    feedPurchases: number;
    medicinePurchases: number;
    eggPurchases: number;
    salaries: number;
    operating: number;
    total: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
  comparison: {
    revenueChange: number;
    profitChange: number;
  };
}

interface CashFlowForecast {
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;
  expectedInflows: {
    customerPayments: number;
    eggSales: number;
    cashSales: number;
    total: number;
  };
  expectedOutflows: {
    vendorPayments: number;
    eggPurchases: number;
    salaries: number;
    operatingExpenses: number;
    total: number;
  };
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

const roundMMK = (value: number) => Math.round(value || 0);

const getDateRange = (period: Period, date: Date) => {
  const endDate = new Date(date);
  const startDate = new Date(date);

  if (period === 'weekly') {
    startDate.setDate(endDate.getDate() - 6);
  } else {
    startDate.setDate(1);
    endDate.setMonth(endDate.getMonth() + 1, 0);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

const getPreviousRange = (period: Period, startDate: Date) => {
  if (period === 'weekly') {
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);
    return { startDate: prevStart, endDate: prevEnd };
  }

  const prevEnd = new Date(startDate);
  prevEnd.setDate(0);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(1);
  prevStart.setHours(0, 0, 0, 0);
  prevEnd.setHours(23, 59, 59, 999);
  return { startDate: prevStart, endDate: prevEnd };
};

export class FinancialServiceClass {
  private async getTransactions(startDate: Date, endDate: Date) {
    return databaseService.findMany('transaction', {
      where: {
        timestamp: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  private async getPaymentRecords(startDate: Date, endDate: Date) {
    return databaseService.findMany('paymentRecord', {
      where: { paymentDate: { gte: startDate, lte: endDate } },
    });
  }

  private async buildSummary(period: Period, date: Date): Promise<{
    summary: FinancialSummary;
    cashFlow: CashFlowForecast;
  }> {
    const { startDate, endDate } = getDateRange(period, date);
    const transactions = (await this.getTransactions(startDate, endDate)) as any[];
    const paymentRecords = (await this.getPaymentRecords(
      startDate,
      endDate,
    )) as any[];

    const revenue = {
      farmerSales: 0,
      regularSales: 0,
      eggSales: 0,
      total: 0,
    };
    const costs = {
      feedPurchases: 0,
      medicinePurchases: 0,
      eggPurchases: 0,
      salaries: 0,
      operating: 0,
      total: 0,
    };

    for (const transaction of transactions) {
      if (['SALE', 'EGG_SALE'].includes(transaction.type)) {
        revenue.total += transaction.total;
        if (transaction.type === 'EGG_SALE') {
          revenue.eggSales += transaction.total;
        }
        if (transaction.customer?.type === 'FARMER') {
          revenue.farmerSales += transaction.total;
        } else {
          revenue.regularSales += transaction.total;
        }
      }

      if (transaction.type === 'PURCHASE') {
        if (transaction.items && transaction.items.length > 0) {
          for (const item of transaction.items) {
            const productType = item.product?.type;
            if (productType === 'FEED') costs.feedPurchases += item.total;
            else if (productType === 'MEDICINE')
              costs.medicinePurchases += item.total;
            else if (productType === 'EGGS')
              costs.eggPurchases += item.total;
          }
        } else {
          costs.operating += transaction.total;
        }
      }
    }

    costs.total =
      costs.feedPurchases +
      costs.medicinePurchases +
      costs.eggPurchases +
      costs.salaries +
      costs.operating;

    const profitGross =
      revenue.total -
      (costs.feedPurchases + costs.medicinePurchases + costs.eggPurchases);
    const profitNet = revenue.total - costs.total;

    const summary: FinancialSummary = {
      period,
      startDate,
      endDate,
      revenue: {
        farmerSales: roundMMK(revenue.farmerSales),
        regularSales: roundMMK(revenue.regularSales),
        eggSales: roundMMK(revenue.eggSales),
        total: roundMMK(revenue.total),
      },
      costs: {
        feedPurchases: roundMMK(costs.feedPurchases),
        medicinePurchases: roundMMK(costs.medicinePurchases),
        eggPurchases: roundMMK(costs.eggPurchases),
        salaries: roundMMK(costs.salaries),
        operating: roundMMK(costs.operating),
        total: roundMMK(costs.total),
      },
      profit: {
        gross: roundMMK(profitGross),
        net: roundMMK(profitNet),
        margin:
          revenue.total > 0
            ? Math.round((profitNet / revenue.total) * 1000) / 10
            : 0,
      },
      comparison: { revenueChange: 0, profitChange: 0 },
    };

    const customerPayments = paymentRecords
      .filter((record) => record.type === 'CUSTOMER_PAYMENT')
      .reduce((sum, record) => sum + record.amount, 0);
    const vendorPayments = paymentRecords
      .filter((record) => record.type === 'VENDOR_PAYMENT')
      .reduce((sum, record) => sum + record.amount, 0);

    const cashSales = transactions
      .filter(
        (transaction) =>
          transaction.paymentMethod === 'CASH' &&
          transaction.type === 'SALE',
      )
      .reduce((sum, transaction) => sum + transaction.total, 0);

    const cashFlow: CashFlowForecast = {
      period: period === 'weekly' ? 'week' : 'month',
      startDate,
      endDate,
      expectedInflows: {
        customerPayments: roundMMK(customerPayments),
        eggSales: roundMMK(revenue.eggSales),
        cashSales: roundMMK(cashSales),
        total: roundMMK(customerPayments + revenue.eggSales + cashSales),
      },
      expectedOutflows: {
        vendorPayments: roundMMK(vendorPayments),
        eggPurchases: roundMMK(costs.eggPurchases),
        salaries: roundMMK(costs.salaries),
        operatingExpenses: roundMMK(costs.operating),
        total: roundMMK(
          vendorPayments +
            costs.eggPurchases +
            costs.salaries +
            costs.operating,
        ),
      },
      netCashFlow: 0,
      openingBalance: 0,
      closingBalance: 0,
    };

    cashFlow.netCashFlow =
      cashFlow.expectedInflows.total - cashFlow.expectedOutflows.total;
    cashFlow.openingBalance = 0;
    cashFlow.closingBalance = cashFlow.openingBalance + cashFlow.netCashFlow;

    return { summary, cashFlow };
  }

  async getFinancialDashboardData(period: Period, date: string) {
    const targetDate = new Date(date);
    const { summary, cashFlow } = await this.buildSummary(period, targetDate);

    const { startDate: prevStart, endDate: prevEnd } = getPreviousRange(
      period,
      summary.startDate,
    );

    const previous = await this.buildSummary(period, prevStart);
    const previousRevenue = previous.summary.revenue.total;
    const previousProfit = previous.summary.profit.net;

    summary.comparison.revenueChange =
      previousRevenue > 0
        ? Math.round(((summary.revenue.total - previousRevenue) / previousRevenue) * 1000) /
          10
        : 0;
    summary.comparison.profitChange =
      previousProfit > 0
        ? Math.round(((summary.profit.net - previousProfit) / previousProfit) * 1000) /
          10
        : 0;

    return { summary, cashFlow };
  }
}

export const FinancialService = new FinancialServiceClass();
