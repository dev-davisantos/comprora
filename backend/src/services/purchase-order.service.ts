import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { PurchaseOrder } from '../database/entities/purchase-order.entity';
import { PurchaseOrderRepository } from '../database/repositories/purchase-order.repository';
import { SegmentRepository } from '../database/repositories/segment.repository';
import { SectorRepository } from '../database/repositories/sector.repository';
import { SupplierRepository } from '../database/repositories/supplier.repository';

export interface PurchaseOrderFilters {
  status?: string;
  supplierId?: number;
  segmentId?: number;
  projectId?: number;
  /** Month of issueDate, format YYYY-MM */
  month?: string;
}

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly orderRepository: PurchaseOrderRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly sectorRepository: SectorRepository,
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const segment = await this.segmentRepository.findOne({ where: { id: dto.segmentId } });
    if (!segment) {
      throw new NotFoundException(`Segment with id ${dto.segmentId} not found`);
    }

    const supplier = await this.supplierRepository.findOne({ where: { id: dto.supplierId } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${dto.supplierId} not found`);
    }

    const order = this.orderRepository.create({
      orderNumber: dto.orderNumber,
      issueDate: new Date(dto.issueDate),
      segment,
      resource: dto.resource ?? null,
      description: dto.description,
      supplier,
      requester: dto.requester,
      serviceType: dto.serviceType,
      initialValue: dto.initialValue,
      finalValue: dto.finalValue,
      invoiceNumber: dto.invoiceNumber ?? null,
      paymentCondition: dto.paymentCondition ?? null,
      deliveryDeadline: dto.deliveryDeadline,
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
      authorizationDate: null,
    });

    if (dto.sectorId !== undefined) {
      order.sector = await this.loadSectorOfSegment(dto.sectorId, segment.id);
    }

    return this.orderRepository.save(order);
  }

  async findAll(filters: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    if (filters.month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)) {
      throw new BusinessRuleException(`Invalid month "${filters.month}" — expected YYYY-MM`);
    }

    const where: FindOptionsWhere<PurchaseOrder> = {};
    if (filters.status !== undefined) where.status = filters.status as PurchaseOrder['status'];
    if (filters.supplierId !== undefined) where.supplier = { id: filters.supplierId };
    if (filters.segmentId !== undefined) where.segment = { id: filters.segmentId };

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.segment', 'segment')
      .leftJoinAndSelect('order.sector', 'sector')
      .leftJoinAndSelect('order.supplier', 'supplier');

    if (Object.keys(where).length > 0) {
      query.where(where);
    }

    if (filters.projectId !== undefined) {
      query
        .innerJoin('order.orderProjects', 'op')
        .andWhere('op.project_id = :projectId', { projectId: filters.projectId });
    }

    if (filters.month !== undefined) {
      query.andWhere("strftime('%Y-%m', order.issueDate) = :month", { month: filters.month });
    }

    query.orderBy('order.issueDate', 'DESC').addOrderBy('order.id', 'DESC');

    return query.getMany();
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { segment: true, sector: true, supplier: true, orderProjects: true },
    });

    if (!order) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }

    return order;
  }

  async update(id: number, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const order = await this.findOne(id);

    if (dto.segmentId !== undefined && dto.segmentId !== order.segment.id) {
      const segment = await this.segmentRepository.findOne({ where: { id: dto.segmentId } });
      if (!segment) {
        throw new NotFoundException(`Segment with id ${dto.segmentId} not found`);
      }
      order.segment = segment;
      // The previous sector belongs to the old segment — require sectorId below.
      if (dto.sectorId === undefined) {
        order.sector = null;
      }
    }

    if (dto.sectorId !== undefined) {
      order.sector = await this.loadSectorOfSegment(dto.sectorId, order.segment.id);
    }

    if (dto.supplierId !== undefined && dto.supplierId !== order.supplier.id) {
      const supplier = await this.supplierRepository.findOne({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException(`Supplier with id ${dto.supplierId} not found`);
      }
      order.supplier = supplier;
    }

    if (dto.orderNumber !== undefined) order.orderNumber = dto.orderNumber;
    if (dto.issueDate !== undefined) order.issueDate = new Date(dto.issueDate);
    if (dto.resource !== undefined) order.resource = dto.resource;
    if (dto.description !== undefined) order.description = dto.description;
    if (dto.requester !== undefined) order.requester = dto.requester;
    if (dto.serviceType !== undefined) order.serviceType = dto.serviceType;
    if (dto.initialValue !== undefined) order.initialValue = dto.initialValue;
    if (dto.finalValue !== undefined) order.finalValue = dto.finalValue;
    if (dto.invoiceNumber !== undefined) order.invoiceNumber = dto.invoiceNumber;
    if (dto.paymentCondition !== undefined) order.paymentCondition = dto.paymentCondition;
    if (dto.deliveryDeadline !== undefined) order.deliveryDeadline = dto.deliveryDeadline;
    if (dto.deliveryDate !== undefined) order.deliveryDate = new Date(dto.deliveryDate);

    return this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  private async loadSectorOfSegment(sectorId: number, segmentId: number) {
    const sector = await this.sectorRepository.findOne({
      where: { id: sectorId },
      relations: { segment: true },
    });

    if (!sector) {
      throw new NotFoundException(`Sector with id ${sectorId} not found`);
    }

    if (sector.segment.id !== segmentId) {
      throw new BusinessRuleException(
        `Sector ${sector.id} does not belong to segment ${segmentId}`,
      );
    }

    return sector;
  }
}
