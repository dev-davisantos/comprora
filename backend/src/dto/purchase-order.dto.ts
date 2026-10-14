import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length } from 'class-validator';
import { ServiceType } from '../database/enums/service-type.enum';
import { OrderStatus } from '../database/enums/order-status.enum';
import { PaymentCondition } from '../database/enums/payment-condition.enum';
import { DECIMAL_12_2_MESSAGE, DECIMAL_12_2_REGEX } from './validation';
import { IsDateString, Matches } from 'class-validator';

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

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}
