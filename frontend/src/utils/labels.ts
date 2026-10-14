import type {
  OrderStatus,
  PaymentCondition,
  ProjectStatus,
  SegmentType,
  ServiceType,
} from '@/api/types';

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  AUTHORIZED: 'Autorizado',
  DELIVERED: 'Entregue',
  INVOICED: 'Faturado',
  CANCELLED: 'Cancelado',
};

export const serviceTypeLabels: Record<ServiceType, string> = {
  PURCHASE: 'Compra',
  SERVICE: 'Serviço',
};

export const segmentTypeLabels: Record<SegmentType, string> = {
  PROJECT: 'Projeto',
  STANDARD: 'Padrão',
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const paymentConditionLabels: Record<PaymentCondition, string> = {
  ANTECIPATED: 'Antecipado',
  DD15: '15 dias',
  DD30: '30 dias',
  DD45: '45 dias',
  DD60: '60 dias',
};

