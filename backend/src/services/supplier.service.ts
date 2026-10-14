import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto, UpdateSupplierDto } from '../dto/supplier.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { Supplier } from '../database/entities/supplier.entity';
import { SupplierRepository } from '../database/repositories/supplier.repository';

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const existing = await this.supplierRepository.findOne({
      where: { cnpj: createSupplierDto.cnpj },
    });

    if (existing) {
      throw new BusinessRuleException(
        `A supplier with CNPJ ${createSupplierDto.cnpj} already exists`,
      );
    }

    const supplier = this.supplierRepository.create(createSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(search?: string): Promise<Supplier[]> {
    if (search) {
      return this.supplierRepository
        .createQueryBuilder('supplier')
        .where('supplier.displayName LIKE :search OR supplier.corporateName LIKE :search', {
          search: `%${search}%`,
        })
        .orderBy('supplier.displayName', 'ASC')
        .getMany();
    }

    return this.supplierRepository.find({ order: { displayName: 'ASC' } });
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (updateSupplierDto.cnpj !== undefined && updateSupplierDto.cnpj !== supplier.cnpj) {
      const existing = await this.supplierRepository.findOne({
        where: { cnpj: updateSupplierDto.cnpj },
      });

      if (existing) {
        throw new BusinessRuleException(
          `A supplier with CNPJ ${updateSupplierDto.cnpj} already exists`,
        );
      }
    }

    this.supplierRepository.merge(supplier, updateSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: { orders: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found`);
    }

    if (supplier.orders.length > 0) {
      throw new BusinessRuleException(
        `Cannot delete supplier ${id}: it still has purchase orders`,
      );
    }

    await this.supplierRepository.remove(supplier);
  }
}
