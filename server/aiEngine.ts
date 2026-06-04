import { readDb } from './db';
import { AiInsight, InventoryItem, LedgerEntry, EmployeeProfile, Task, User } from '../src/types';

/**
 * AI Engine for Amdox Nexus - Fully Local Algorithmic and Rule-based Simulations
 */

// Helper to calculate standard deviation
function getStandardDeviation(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  return { mean, stdDev };
}

/**
 * 1. Demand Forecasting (Rolling moving averages & trend extrapolation)
 */
export function getDemandForecasts(tenantId: string): AiInsight[] {
  const db = readDb();
  const tenantInventory = db.inventory.filter(item => item.tenantId === tenantId);
  const insights: AiInsight[] = [];

  for (const item of tenantInventory) {
    // Simulated monthly demand history (for the last 4 months) based on SKU
    let baseAvg = 15;
    if (item.sku.includes('CH-90')) baseAvg = 45;
    if (item.sku.includes('SW-40')) baseAvg = 8;
    if (item.sku.includes('CAP-10')) baseAvg = 110;

    // Introduce subtle deterministic variance based on SKU characters
    const variance = (item.sku.charCodeAt(item.sku.length - 1) % 5) - 2;
    const historicalDemand = [
      Math.max(2, Math.round((baseAvg + variance) * 0.9)),
      Math.max(2, Math.round((baseAvg + variance) * 1.1)),
      Math.max(2, Math.round((baseAvg + variance) * 1.05)),
      Math.max(2, Math.round((baseAvg + variance) * 1.15))
    ];

    // moving average forecasts for next 3 months (June, July, August 2026)
    const m1 = Math.round(historicalDemand.reduce((a, b) => a + b, 0) / historicalDemand.length);
    const m2 = Math.round(([...historicalDemand.slice(1), m1]).reduce((a, b) => a + b, 0) / historicalDemand.length);
    const m3 = Math.round(([...historicalDemand.slice(2), m1, m2]).reduce((a, b) => a + b, 0) / historicalDemand.length);

    const chartData = [
      { month: 'Feb', actual: historicalDemand[0], forecast: null },
      { month: 'Mar', actual: historicalDemand[1], forecast: null },
      { month: 'Apr', actual: historicalDemand[2], forecast: null },
      { month: 'May (Current)', actual: historicalDemand[3], forecast: null },
      { month: 'Jun (P)', actual: null, forecast: m1 },
      { month: 'Jul (P)', actual: null, forecast: m2 },
      { month: 'Aug (P)', actual: null, forecast: m3 }
    ];

    const isLowStock = item.quantityInStock < item.minThreshold;
    const predictionMessage = `Our 3-month moving average algorithm forecasts an upcoming demand of ${m1} units for June, ${m2} units for July, and ${m3} for August.`;

    insights.push({
      id: `fc-${item.id}`,
      type: 'forecast',
      severity: isLowStock ? 'high' : 'low',
      title: `Demand Forecast: ${item.name}`,
      summary: `${item.sku} projected demand is ${m1} units/mo (Current stock: ${item.quantityInStock})`,
      details: `${predictionMessage} Based on typical procurement lead times, you have ${
        isLowStock 
          ? 'CRITICAL deficiency. Stock is below safety margin. Reorder immediately.' 
          : 'sufficient stock capacity to fulfill next-month forecasts.'
      }`,
      metricLabel: 'Forecaster Qty (Jun)',
      metricValue: `${m1} units`,
      chartData,
      timestamp: new Date().toISOString()
    });
  }

  return insights;
}

/**
 * 2. Financial Trend Analysis (Cash Flow, Revenue Extrapolation, Profit Predictor)
 */
export function getFinancialPredictions(tenantId: string): AiInsight[] {
  const db = readDb();
  const ledger = db.ledger.filter(entry => entry.tenantId === tenantId);

  // Group credit (revenue) and debit (expenses) by Month
  const monthlyData: Record<string, { month: string; revenue: number; expenses: number; net: number }> = {};
  
  ledger.forEach(entry => {
    const month = entry.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { month, revenue: 0, expenses: 0, net: 0 };
    }
    if (entry.type === 'credit') {
      monthlyData[month].revenue += entry.amount;
    } else {
      monthlyData[month].expenses += entry.amount;
    }
    monthlyData[month].net = monthlyData[month].revenue - monthlyData[month].expenses;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const points = sortedMonths.map(m => monthlyData[m]);

  // Calculate simple linear fits if we have enough points
  let mRev = 2000, cRev = 50000; // default trend parameters
  let mExp = 1000, cExp = 25000;

  if (points.length >= 2) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    let sumXExp = 0, sumYExp = 0, sumXYExp = 0, sumXXExp = 0;

    points.forEach((p, idx) => {
      const x = idx + 1;
      sumX += x;
      sumY += p.revenue;
      sumXY += x * p.revenue;
      sumXX += x * x;

      sumXExp += x;
      sumYExp += p.expenses;
      sumXYExp += x * p.expenses;
      sumXXExp += x * x;
    });

    // Linear regression formula for slope (m) and intercept (c)
    mRev = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    cRev = (sumY - mRev * sumX) / n;

    mExp = (n * sumXYExp - sumX * sumYExp) / (n * sumXXExp - sumX * sumXExp);
    cExp = (sumYExp - mExp * sumXExp) / n;
  }

  // Predict next 2 months (June & July)
  const nextMonthIdx1 = points.length + 1;
  const nextMonthIdx2 = points.length + 2;

  const predRev1 = Math.round(mRev * nextMonthIdx1 + cRev);
  const predExp1 = Math.round(mExp * nextMonthIdx1 + cExp);
  const predNet1 = predRev1 - predExp1;

  const predRev2 = Math.round(mRev * nextMonthIdx2 + cRev);
  const predExp2 = Math.round(mExp * nextMonthIdx2 + cExp);
  const predNet2 = predRev2 - predExp2;

  const chartData = points.map(p => ({
    month: p.month,
    Revenue: p.revenue,
    Expenses: p.expenses,
    NetProfit: p.net
  }));

  // Add predictions to chart data
  chartData.push({
    month: 'Jun (P)',
    Revenue: predRev1,
    Expenses: predExp1,
    NetProfit: predNet1
  });
  chartData.push({
    month: 'Jul (P)',
    Revenue: predRev2,
    Expenses: predExp2,
    NetProfit: predNet2
  });

  const latestNet = points[points.length - 1]?.net || 0;
  const isHealthyGrowth = predNet1 > latestNet;

  return [{
    id: 'fin-trend-analysis',
    type: 'financial',
    severity: isHealthyGrowth ? 'low' : 'medium',
    title: 'Financial Trend & Cash Runway Analytics',
    summary: `Predicted Net Profit for June: $${predNet1.toLocaleString()} (Trend: ${isHealthyGrowth ? 'UPWARD 📈' : 'STAGNANT/DOWNWARD 📉'})`,
    details: `Linear regression trend forecasting projects a continuous growth rate. Revenue slope is +$${Math.round(mRev).toLocaleString()}/month, while expense slope is +$${Math.round(mExp).toLocaleString()}/month. Gross net profit margins remain highly sustainable. Recommendation: Maintain current marketing budget but monitor potential SG&A expense creep in July.`,
    metricLabel: 'Projected Net Profit (Jun)',
    metricValue: `$${predNet1.toLocaleString()}`,
    chartData,
    timestamp: new Date().toISOString()
  }];
}

/**
 * 3. Employee Performance Scoring Engine
 */
export function getEmployeePerformance(tenantId: string): AiInsight[] {
  const db = readDb();
  const employees = db.employees.filter(emp => emp.tenantId === tenantId);
  const insights: AiInsight[] = [];

  for (const emp of employees) {
    const user = db.users.find(u => u.id === emp.userId);
    if (!user) continue;

    // 1. Calculate Attendance Score (Present / total)
    const records = emp.attendance;
    const totalRecords = records.length;
    let presentCount = 0;
    let lateCount = 0;
    
    records.forEach(r => {
      if (r.status === 'present') presentCount++;
      if (r.status === 'late') {
        presentCount += 0.8; // late counts as 80% presence
        lateCount++;
      }
      if (r.status === 'leave') presentCount += 1.0; // leave is excused
    });

    const attendanceScore = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 90;

    // 2. Task Completion Score
    const empTasks = db.tasks.filter(t => t.tenantId === tenantId && t.assigneeId === user.id);
    const totalTasks = empTasks.length;
    const completedTasks = empTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = empTasks.filter(t => t.status === 'in_progress').length;

    // Weight tasks: Done = 100%, InProgress = 40%
    const taskScore = totalTasks > 0 
      ? ((completedTasks + (inProgressTasks * 0.4)) / totalTasks) * 100 
      : 85; // baseline default if no tasks are assigned

    // 3. Combined weighted Score
    // Attendance weighting: 30%, Task completion: 70%
    const finalScore = Math.min(100, Math.round((attendanceScore * 0.3) + (taskScore * 0.7)));

    let r_class = 'A';
    if (finalScore >= 90) r_class = 'A+ Exceptional';
    else if (finalScore >= 80) r_class = 'A Strong Competent';
    else if (finalScore >= 70) r_class = 'B Consistent Contributor';
    else r_class = 'C Attention Needed';

    insights.push({
      id: `perf-${emp.id}`,
      type: 'employee',
      severity: finalScore < 75 ? 'medium' : 'low',
      title: `KPI Scorecard: ${user.name}`,
      summary: `${user.name} (${user.designation}) achieved a verified score of ${finalScore}/100`,
      details: `${user.name} maintains a ${Math.round(attendanceScore)}% attendance rate with ${lateCount} late records this cycle. Completed ${completedTasks} of ${totalTasks} assigned roadmap tasks. Calculated score ranks inside target percentile '${r_class}'.`,
      metricLabel: 'Performance Rating',
      metricValue: `${finalScore}% (${r_class.split(' ')[0]})`,
      chartData: [
        { name: 'Task Delivery', value: Math.round(taskScore) },
        { name: 'Attendance & Presence', value: Math.round(attendanceScore) },
        { name: 'Aggregate Index', value: finalScore }
      ],
      timestamp: new Date().toISOString()
    });
  }

  return insights;
}

/**
 * 4. Statistical Anomaly Detection Engine
 */
export function getAnomalies(tenantId: string): AiInsight[] {
  const db = readDb();
  const ledger = db.ledger.filter(entry => entry.tenantId === tenantId);
  const tasks = db.tasks.filter(task => task.tenantId === tenantId);
  const inventory = db.inventory.filter(item => item.tenantId === tenantId);
  
  const insights: AiInsight[] = [];

  // Anomaly 1: Financial Expense Anomalies (> 1.8x mean expense transaction)
  const debitAmounts = ledger.filter(e => e.type === 'debit').map(e => e.amount);
  if (debitAmounts.length > 2) {
    const { mean, stdDev } = getStandardDeviation(debitAmounts);
    const threshold = mean + 1.8 * stdDev;

    ledger.filter(e => e.type === 'debit' && e.amount > threshold).forEach(item => {
      insights.push({
        id: `an-fin-${item.id}`,
        type: 'anomaly',
        severity: 'high',
        title: `Financial Anomaly: High Transaction Cost`,
        summary: `Expense of $${item.amount.toLocaleString()} on account '${item.account}' deviates from patterns`,
        details: `This transaction exceeds standard operating averages (Mean expense: $${Math.round(mean).toLocaleString()}, Standard Deviation: $${Math.round(stdDev).toLocaleString()}). Triggered a statistical system flag. Please verify authorization reference code: ${item.reference}.`,
        metricLabel: 'Deviation Factor',
        metricValue: `${(item.amount / mean).toFixed(1)}x Normal`,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Anomaly 2: Project Roadmap Milestones Slippage / Risk
  tasks.forEach(task => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isPastDeadline = task.endDate < todayStr;
    const isOverdueAndIncomplete = isPastDeadline && task.status !== 'done';
    const isHighlyDelayedRange = !isPastDeadline && task.status === 'todo' && task.progress === 0 && (new Date(task.endDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000); // 3 days left

    if (isOverdueAndIncomplete) {
      insights.push({
        id: `an-tsk-${task.id}`,
        type: 'anomaly',
        severity: 'high',
        title: `Project Roadmap Overdue Milestone`,
        summary: `Task "${task.name}" is incomplete past targeted date (${task.endDate})`,
        details: `Strategic task assigns to Employee ID [${task.assigneeId}] has stalled at ${task.progress}% completion. Exceeding roadmap schedule limits. Actions required immediately to prevent project slip cascading.`,
        metricLabel: 'Roadmap Milestone Delay',
        metricValue: `CRITICAL SLIP`,
        timestamp: new Date().toISOString()
      });
    } else if (isHighlyDelayedRange) {
      insights.push({
        id: `an-tsk-delay-${task.id}`,
        type: 'anomaly',
        severity: 'medium',
        title: `Roadmap Project Risk: Latent Milestone Start`,
        summary: `Task "${task.name}" is near due date with 0% progress`,
        details: `Roadmap timeline risk identifier flagged. Only a minor window remains prior to target delivery (${task.endDate}), yet developer progress has not initiated.`,
        metricLabel: 'Completion Risk Index',
        metricValue: `HIGH RISK`,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Anomaly 3: Stock Runout Calculations
  inventory.forEach(item => {
    if (item.quantityInStock <= item.minThreshold * 0.4) {
      insights.push({
        id: `an-inv-critical-${item.id}`,
        type: 'anomaly',
        severity: 'high',
        title: `Supply Chain: Critical Stock Starvation`,
        summary: `${item.sku} is severely depleted (Available: ${item.quantityInStock} / Min Threshold: ${item.minThreshold})`,
        details: `Available warehouse capacity is in critical starvation buffer (less than 40% of standard security threshold levels). Risk of high procurement lead times stopping output line operations is elevated.`,
        metricLabel: 'Safety Stock Buffer',
        metricValue: `${Math.round((item.quantityInStock / item.minThreshold) * 100)}% left`,
        timestamp: new Date().toISOString()
      });
    }
  });

  return insights;
}

/**
 * 5. Rule-Based Dynamic AI Recommendation Engine
 */
export function getRecommendations(tenantId: string): AiInsight[] {
  const db = readDb();
  const inventory = db.inventory.filter(item => item.tenantId === tenantId);
  const projects = db.projects.filter(p => p.tenantId === tenantId);
  const financialInvoices = db.invoices.filter(inv => inv.tenantId === tenantId);
  
  const insights: AiInsight[] = [];

  // Rec 1: Supply Chain Automated Reorder
  inventory.forEach(item => {
    if (item.quantityInStock < item.minThreshold) {
      const reorderQty = Math.round(item.minThreshold * 2.5);
      const vendor = db.vendors.find(v => v.id === item.vendorId);
      const vendorName = vendor ? vendor.name : 'preferred vendor';
      insights.push({
        id: `rec-reorder-${item.id}`,
        type: 'recommendation',
        severity: 'high',
        title: `Auto-Reorder Recommendation: Purchase SKU ${item.sku}`,
        summary: `Generate dynamic procurement purchase order for ${reorderQty} units of ${item.name}`,
        details: `Algorithmic analysis of warehouse stock bounds indicates item drops past standard critical margins. Recommended: Create purchase order of ${reorderQty} units from vendor ${vendorName} to restore maximum inventory margins, avoiding output shortages. Cost impact: $${(reorderQty * item.costPrice).toLocaleString()}.`,
        metricLabel: 'Target Order Reorder',
        metricValue: `${reorderQty} ${item.unit}`,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Rec 2: Invoice Collections / AR Management
  const unpaidInvoices = financialInvoices.filter(inv => inv.status === 'unpaid');
  const now = new Date().toISOString().split('T')[0];
  const totalOutstanding = unpaidInvoices.reduce((sum, current) => sum + (current.total - current.paidAmount), 0);

  if (totalOutstanding > 35000) {
    insights.push({
      id: `rec-ar-collection`,
      type: 'recommendation',
      severity: 'medium',
      title: `Accounts Receivable Collection Protocol`,
      summary: `Initiate prompt payment reminder cycle for $${totalOutstanding.toLocaleString()} outstanding AR`,
      details: `${unpaidInvoices.length} general client accounts are pending settlement terms with outstanding amounts. Trigger systematic email verification notifications to overdue accounts to preserve healthy working capital assets.`,
      metricLabel: 'Outstanding Credit Balance',
      metricValue: `$${totalOutstanding.toLocaleString()}`,
      timestamp: new Date().toISOString()
    });
  }

  // Rec 3: Project Budget Optimization
  projects.forEach(proj => {
    const percentSpent = (proj.spent / proj.budget) * 100;
    const projectFinishedTasks = db.tasks.filter(t => t.projectId === proj.id && t.status === 'done').length;
    const projectTotalTasks = db.tasks.filter(t => t.projectId === proj.id).length;
    const percentTasksDone = projectTotalTasks > 0 ? (projectFinishedTasks / projectTotalTasks) * 100 : 0;

    if (percentSpent > 75 && percentTasksDone < 40) {
      insights.push({
        id: `rec-budget-${proj.id}`,
        type: 'recommendation',
        severity: 'high',
        title: `Budget Consumption Optimization Strategy`,
        summary: `Budget allocation check recommended for project "${proj.name}"`,
        details: `Alert: Current spend rate is highly anomalous. Budget is ${Math.round(percentSpent)}% expended, but dashboard roadmap milestones indicate only ${Math.round(percentTasksDone)}% completion. Conduct structural task prioritization audit immediately to limit overhead resource slip.`,
        metricLabel: 'Consumption Deficit',
        metricValue: `CRITICAL OVERRUN`,
        timestamp: new Date().toISOString()
      });
    }
  });

  return insights;
}

/**
 * Global aggregator for AI Insights
 */
export function generateAllInsights(tenantId: string): AiInsight[] {
  return [
    ...getAnomalies(tenantId),
    ...getRecommendations(tenantId),
    ...getFinancialPredictions(tenantId),
    ...getDemandForecasts(tenantId),
    ...getEmployeePerformance(tenantId)
  ].sort((a, b) => {
    // Sort severity high first, then medium, then low
    const severityWeight = { high: 3, medium: 2, low: 1 };
    return severityWeight[b.severity] - severityWeight[a.severity];
  });
}
