/** Types mirroring the backend DTOs/entities. Money is a decimal string. */

export type DecimalString = string; // "1234.56"
export type IsoDate = string; // "2026-10-01T00:00:00.000Z"
export type DateInput = string; // "YYYY-MM-DD"
export type MonthString = string; // "YYYY-MM"

export type SegmentType = 'PROJECT' | 'STANDARD';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ServiceType = 'PURCHASE' | 'SERVICE';
export type OrderStatus = 'PENDING' | 'AUTHORIZED' | 'DELIVERED' | 'INVOICED' | 'CANCELLED';
export type PaymentCondition = 'ANTECIPATED' | 'DD15' | 'DD30' | 'DD45' | 'DD60';

export interface Segment {
  id: number;
  name: string;
  type: SegmentType;
}

export interface Sector {
  id: number;
  name: string;
  segment: Segment;
}

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  startDate: IsoDate;
  forecastEndDate: IsoDate;
  realEndDate: IsoDate | null;
  budget: DecimalString;
  realCost: DecimalString;
  segment: Segment;
}

export interface Supplier {
  id: number;
  displayName: string;
  corporateName: string;
  cnpj: string;
}

export interface OrderProject {
  id: number;
  project: Project;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: number;
  issueDate: IsoDate;
  segment: Segment;
  sector: Sector | null;
  resource: string | null;
  description: string;
  supplier: Supplier;
  requester: string;
  serviceType: ServiceType;
  authorizationDate: IsoDate | null;
  initialValue: DecimalString;
  finalValue: DecimalString;
  status: OrderStatus;
  invoiceNumber: number | null;
  paymentCondition: PaymentCondition | null;
  deliveryDeadline: number;
  deliveryDate: IsoDate | null;
  orderProjects: OrderProject[];
}

export interface Budget {
  id: number;
  monthYear: IsoDate;
  week: number;
  plannedValue: DecimalString;
}

export interface BudgetWeekIndicator {
  week: number;
  plannedValue: DecimalString | null;
  realizedValue: DecimalString;
  remainingValue: DecimalString | null;
}

export interface BudgetIndicator {
  month: MonthString;
  weeks: BudgetWeekIndicator[];
  totalPlanned: DecimalString;
  totalRealized: DecimalString;
  totalRemaining: DecimalString;
}

export interface SpendEntry {
  id: number;
  name: string;
  total: DecimalString;
}

export interface DashboardSummary {
  totalSavings: DecimalString;
  totalSpend: DecimalString;
  spendBySegment: SpendEntry[];
  spendByProject: SpendEntry[];
  spendBySupplier: SpendEntry[];
  budget: BudgetIndicator | null;
}
