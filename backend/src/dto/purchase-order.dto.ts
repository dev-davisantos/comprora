import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';
import { ServiceType } from '../database/enums/service-type.enum';
import { OrderStatus } from '../database/enums/order-status.enum';
import { PaymentCondition } from '../database/enums/payment-condition.enum';
import { DECIMAL_12_2_MESSAGE, DECIMAL_12_2_REGEX } from './validation';

/** Body of `PATCH /purchase-orders/:id/status`. */
export class ChangeStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsDateString()
  authorizationDate?: string;
}

export class ApprovePurchaseOrderDto {
  @IsDateString()
  authorizationDate: string;
}

/** Body of `PUT /purchase-orders/:id/projects` — replaces the linked projects. */
export class SetProjectsDto {
  @IsArray()
  @IsInt({ each: true })
  projectIds: number[];
}

/**
 * Status is not part of create/update — it moves only through
 * `POST /purchase-orders/:id/approve` and `PATCH /purchase-orders/:id/status`.
 */
export class CreatePurchaseOrderDto {
  @IsInt()
  @IsPositive()
  orderNumber: number;

  @IsDateString()
  issueDate: string;

  @IsInt()
  @IsPositive()
  segmentId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  sectorId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  resource?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsPositive()
  supplierId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  requester: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @Matches(DECIMAL_12_2_REGEX, { message: DECIMAL_12_2_MESSAGE })
  initialValue: string;

  @Matches(DECIMAL_12_2_REGEX, { message: DECIMAL_12_2_MESSAGE })
  finalValue: string;

  @IsOptional()
  @IsInt()
  invoiceNumber?: number;

  @IsOptional()
  @IsEnum(PaymentCondition)
  paymentCondition?: PaymentCondition;

  @IsInt()
  @IsPositive()
  deliveryDeadline: number;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}
