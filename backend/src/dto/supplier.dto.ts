import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  corporateName: string;

  /** CNPJ: exactly 14 digits, digits only, leading zeros preserved. */
  @Matches(/^\d{14}$/, { message: 'cnpj must contain exactly 14 digits' })
  cnpj: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
