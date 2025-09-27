import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { ProfitLossData, CashFlowForecast } from '../../types/core';

interface FinancialSummary {
  period: 'weekly' | 'monthly';
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

const FinancialDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>(
    'weekly',
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [financialData, setFinancialData] = useState<FinancialSummary | null>(
    null,
  );
  const [cashFlowData, setCashFlowData] = useState<CashFlowForecast | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const generateMockData = () => {
      setLoading(true);

      // Calculate date range
      const endDate = new Date(selectedDate);
      const startDate = new Date(selectedDate);

      if (selectedPeriod === 'weekly') {
        startDate.setDate(endDate.getDate() - 6);
      } else {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
      }

      const mockData: FinancialSummary = {
        period: selectedPeriod,
        startDate,
        endDate,
        revenue: {
          farmerSales: selectedPeriod === 'weekly' ? 25000 : 95000,
          regularSales: selectedPeriod === 'weekly' ? 8000 : 28000,
          eggSales: selectedPeriod === 'weekly' ? 6000 : 22000,
          total: selectedPeriod === 'weekly' ? 39000 : 145000,
        },
        costs: {
          feedPurchases: selectedPeriod === 'weekly' ? 18000 : 68000,
          medicinePurchases: selectedPeriod === 'weekly' ? 5000 : 18000,
          eggPurchases: selectedPeriod === 'weekly' ? 4000 : 14000,
          salaries: selectedPeriod === 'weekly' ? 3000 : 12000,
          operating: selectedPeriod === 'weekly' ? 2000 : 8000,
          total: selectedPeriod === 'weekly' ? 32000 : 120000,
        },
        profit: {
          gross: selectedPeriod === 'weekly' ? 17000 : 65000,
          net: selectedPeriod === 'weekly' ? 7000 : 25000,
          margin: selectedPeriod === 'weekly' ? 17.9 : 17.2,
        },
        comparison: {
          revenueChange: selectedPeriod === 'weekly' ? 8.5 : 12.3,
          profitChange: selectedPeriod === 'weekly' ? 15.2 : 18.7,
        },
      };

      const mockCashFlow: CashFlowForecast = {
        period: selectedPeriod === 'weekly' ? 'week' : 'month',
        startDate: new Date(),
        endDate: new Date(
          Date.now() +
            (selectedPeriod === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000,
        ),
        expectedInflows: {
          customerPayments: selectedPeriod === 'weekly' ? 35000 : 125000,
          eggSales: selectedPeriod === 'weekly' ? 6500 : 24000,
          cashSales: selectedPeriod === 'weekly' ? 12000 : 45000,
          total: selectedPeriod === 'weekly' ? 53500 : 194000,
        },
        expectedOutflows: {
          vendorPayments: selectedPeriod === 'weekly' ? 45000 : 165000,
          eggPurchases: selectedPeriod === 'weekly' ? 4200 : 15000,
          salaries: selectedPeriod === 'weekly' ? 3000 : 12000,
          operatingExpenses: selectedPeriod === 'weekly' ? 2500 : 9000,
          total: selectedPeriod === 'weekly' ? 54700 : 201000,
        },
        netCashFlow: selectedPeriod === 'weekly' ? -1200 : -7000,
        openingBalance: 25000,
        closingBalance: selectedPeriod === 'weekly' ? 23800 : 18000,
      };

      setTimeout(() => {
        setFinancialData(mockData);
        setCashFlowData(mockCashFlow);
        setLoading(false);
      }, 500);
    };

    generateMockData();
  }, [selectedPeriod, selectedDate]);

  const exportReport = () => {
    if (!financialData) return;

    const reportData = {
      period: `${financialData.period} Report`,
      dateRange: `${financialData.startDate.toLocaleDateString()} - ${financialData.endDate.toLocaleDateString()}`,
      revenue: financialData.revenue,
      costs: financialData.costs,
      profit: financialData.profit,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${financialData.period}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !financialData || !cashFlowData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading financial data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Dashboard
            </h1>
            <p className="text-gray-600">
              Profit & Loss Analysis and Cash Flow Forecasting
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportReport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Period and Date Selection */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex bg-white rounded-lg border border-gray-300">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-l-lg font-medium ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-r-lg font-medium ${
                selectedPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
          </div>

          <input
            type={selectedPeriod === 'weekly' ? 'date' : 'month'}
            value={
              selectedPeriod === 'weekly'
                ? selectedDate.toISOString().split('T')[0]
                : selectedDate.toISOString().slice(0, 7)
            }
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <div className="text-sm text-gray-600">
            {financialData.startDate.toLocaleDateString()} -{' '}
            {financialData.endDate.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialData.revenue.total.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                {financialData.comparison.revenueChange > 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`ml-1 text-sm ${
                    financialData.comparison.revenueChange > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {Math.abs(financialData.comparison.revenueChange)}% vs last{' '}
                  {selectedPeriod}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Gross Profit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialData.profit.gross.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(
                  (financialData.profit.gross / financialData.revenue.total) *
                  100
                ).toFixed(1)}
                % margin
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialData.profit.net.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="ml-1 text-sm text-green-600">
                  {financialData.comparison.profitChange}% vs last{' '}
                  {selectedPeriod}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">
                {financialData.profit.margin}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Target: 20%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Revenue Breakdown
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                  <span className="text-gray-700">Farmer Sales</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${financialData.revenue.farmerSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      (financialData.revenue.farmerSales /
                        financialData.revenue.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                  <span className="text-gray-700">Regular Customer Sales</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${financialData.revenue.regularSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      (financialData.revenue.regularSales /
                        financialData.revenue.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                  <span className="text-gray-700">Egg Sales</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${financialData.revenue.eggSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      (financialData.revenue.eggSales /
                        financialData.revenue.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="mt-6 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Revenue Chart Visualization</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Cost Breakdown
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                  <span className="text-gray-700">Feed Purchases</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${financialData.costs.feedPurchases.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      (financialData.costs.feedPurchases /
                        financialData.costs.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                  <span className="text-gray-700">Medicine Purchases</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${financialData.costs.medicinePurchases.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      (financialData.costs.medicinePurchases /
                        financialData.costs.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                  <span className="text-gray-700">Egg Purchases</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${financialData.costs.eggPurchases.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      (financialData.costs.eggPurchases /
                        financialData.costs.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-500 rounded mr-3"></div>
                  <span className="text-gray-700">Operating Expenses</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    $
                    {(
                      financialData.costs.salaries +
                      financialData.costs.operating
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(
                      ((financialData.costs.salaries +
                        financialData.costs.operating) /
                        financialData.costs.total) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Chart Placeholder */}
            <div className="mt-6 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Cost Chart Visualization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Cash Flow Forecast - Next{' '}
            {selectedPeriod === 'weekly' ? 'Week' : 'Month'}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Expected Inflows */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600 mr-2" />
                Expected Inflows
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Payments</span>
                  <span className="font-medium text-green-600">
                    $
                    {cashFlowData.expectedInflows.customerPayments.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Egg Sales</span>
                  <span className="font-medium text-green-600">
                    ${cashFlowData.expectedInflows.eggSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash Sales</span>
                  <span className="font-medium text-green-600">
                    ${cashFlowData.expectedInflows.cashSales.toLocaleString()}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold">
                  <span>Total Inflows</span>
                  <span className="text-green-600">
                    ${cashFlowData.expectedInflows.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Expected Outflows */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-600 mr-2" />
                Expected Outflows
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor Payments</span>
                  <span className="font-medium text-red-600">
                    $
                    {cashFlowData.expectedOutflows.vendorPayments.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Egg Purchases</span>
                  <span className="font-medium text-red-600">
                    $
                    {cashFlowData.expectedOutflows.eggPurchases.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salaries</span>
                  <span className="font-medium text-red-600">
                    ${cashFlowData.expectedOutflows.salaries.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Operating Expenses</span>
                  <span className="font-medium text-red-600">
                    $
                    {cashFlowData.expectedOutflows.operatingExpenses.toLocaleString()}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold">
                  <span>Total Outflows</span>
                  <span className="text-red-600">
                    ${cashFlowData.expectedOutflows.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Position */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600 mr-2" />
                Cash Position
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Opening Balance</span>
                  <span className="font-medium">
                    ${cashFlowData.openingBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Cash Flow</span>
                  <span
                    className={`font-medium ${
                      cashFlowData.netCashFlow >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${cashFlowData.netCashFlow.toLocaleString()}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Projected Balance</span>
                  <span
                    className={
                      cashFlowData.closingBalance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    ${cashFlowData.closingBalance.toLocaleString()}
                  </span>
                </div>

                {cashFlowData.closingBalance < 5000 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 text-sm font-medium">
                        Low cash balance warning
                      </span>
                    </div>
                  </div>
                )}

                {cashFlowData.closingBalance < 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-800 text-sm font-medium">
                        Negative cash flow - immediate attention required
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recommended Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {financialData.profit.margin < 15 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    Low Profit Margin
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Consider reviewing pricing strategy or reducing costs
                </p>
              </div>
            )}

            {cashFlowData.netCashFlow < 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">
                    Negative Cash Flow
                  </span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Focus on collecting receivables and managing payables
                </p>
              </div>
            )}

            {financialData.comparison.revenueChange > 20 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Strong Revenue Growth
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Consider expanding inventory to meet increased demand
                </p>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Regular Review
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Schedule weekly financial reviews to track performance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
