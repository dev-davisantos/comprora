import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { ApprovePurchaseOrderDto, ChangeStatusDto, CreatePurchaseOrderDto, SetProjectsDto, UpdatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { OrderStatus } from '../database/enums/order-status.enum';
import { OrderProject } from '../database/entities/order-project.entity';
import { Project } from '../database/entities/project.entity';
import { PurchaseOrder } from '../database/entities/purchase-order.entity';
import { OrderProjectRepository } from '../database/repositories/order-project.repository';
import { ProjectRepository } from '../database/repositories/project.repository';
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

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.AUTHORIZED, OrderStatus.CANCELLED],
  [OrderStatus.AUTHORIZED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.INVOICED, OrderStatus.CANCELLED],
  [OrderStatus.INVOICED]: [OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly orderRepository: PurchaseOrderRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly sectorRepository: SectorRepository,
    private readonly supplierRepository: SupplierRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly orderProjectRepository: OrderProjectRepository,
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
      relations: {
        segment: true,
        sector: true,
        supplier: true,
        orderProjects: { project: true },
      },
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

    const saved = await this.orderRepository.save(order);

    // finalValue feeds project.realCost — recompute for linked projects.
    if (dto.finalValue !== undefined) {
      await this.recalculateRealCostForOrder(saved);
    }

    return saved;
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    const projectIds = order.orderProjects.map((op) => op.project.id);

    await this.orderProjectRepository.delete({ order: { id: order.id } });
    await this.orderRepository.remove(order);

    await this.recalculateRealCost(projectIds);
  }

  /**
   * `POST /purchase-orders/:id/approve` — sets AUTHORIZED with the supplied date.
   * Only PENDING orders can be approved.
   */
  async approve(
    id: number,
    dto: ApprovePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessRuleException(
        `Only PENDING orders can be approved — order ${id} is ${order.status}`,
      );
    }

    order.status = OrderStatus.AUTHORIZED;
    order.authorizationDate = this.toAuthorizationDate(order, dto.authorizationDate);

    return this.orderRepository.save(order);
  }

  /**
   * `PATCH /purchase-orders/:id/status` — allowed transitions:
   * PENDING → AUTHORIZED → DELIVERED → INVOICED; CANCELLED from any state.
   */
  async changeStatus(id: number, dto: ChangeStatusDto): Promise<PurchaseOrder> {
    const order = await this.findOne(id);

    if (order.status === dto.status) {
      throw new BusinessRuleException(`Order ${id} is already ${dto.status}`);
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BusinessRuleException(
        `Invalid status transition: ${order.status} → ${dto.status} (allowed: ${allowed.join(', ') || 'none'})`,
      );
    }

    order.status = dto.status;

    // Require an explicit approval date on every path that authorizes the order.
    if (dto.status === OrderStatus.AUTHORIZED) {
      if (!dto.authorizationDate) {
        throw new BusinessRuleException('Authorization date is required to authorize an order');
      }
      order.authorizationDate = this.toAuthorizationDate(order, dto.authorizationDate);
    }

    const saved = await this.orderRepository.save(order);

    // Cancellation changes what counts toward each project's realCost.
    if (dto.status === OrderStatus.CANCELLED) {
      await this.recalculateRealCostForOrder(saved);
    }

    return saved;
  }

  private toAuthorizationDate(order: PurchaseOrder, input: string): Date {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      throw new BusinessRuleException('Authorization date must be a valid date');
    }

    if (date.getUTCFullYear() !== order.issueDate.getUTCFullYear()) {
      throw new BusinessRuleException(
        'Authorization date must be in the same year as the order issue date',
      );
    }

    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  /**
   * `PUT /purchase-orders/:id/projects` — replaces the linked projects (N–N)
   * and recalculates realCost on every affected project.
   */
  async setProjects(id: number, dto: SetProjectsDto): Promise<PurchaseOrder> {
    const order = await this.findOne(id);

    const previousProjectIds = order.orderProjects.map((op) => op.project.id);

    const projects: Project[] = [];
    for (const projectId of dto.projectIds) {
      const project = await this.projectRepository.findOne({ where: { id: projectId } });
      if (!project) {
        throw new NotFoundException(`Project with id ${projectId} not found`);
      }
      projects.push(project);
    }

    await this.orderProjectRepository.delete({ order: { id: order.id } });

    for (const project of projects) {
      const link = this.orderProjectRepository.create({ order, project });
      await this.orderProjectRepository.save(link);
    }

    const affected = new Set([...previousProjectIds, ...dto.projectIds]);
    await this.recalculateRealCost([...affected]);

    return this.findOne(id);
  }

  /**
   * Project.realCost = SUM of finalValue of linked orders, excluding CANCELLED.
   */
  private async recalculateRealCost(projectIds: number[]): Promise<void> {
    for (const projectId of projectIds) {
      const row = await this.orderProjectRepository
        .createQueryBuilder('op')
        .innerJoin('op.order', 'order')
        .select('COALESCE(SUM(order.finalValue), 0)', 'total')
        .where('op.project_id = :projectId', { projectId })
        .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
        .getRawOne<{ total: string }>();

      const project = await this.projectRepository.findOne({ where: { id: projectId } });
      if (!project) {
        continue;
      }

      project.realCost = Number(row?.total ?? 0).toFixed(2);
      await this.projectRepository.save(project);
    }
  }

  private async recalculateRealCostForOrder(order: PurchaseOrder): Promise<void> {
    const projectIds = order.orderProjects.map((op) => op.project.id);
    if (projectIds.length > 0) {
      await this.recalculateRealCost(projectIds);
    }
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
