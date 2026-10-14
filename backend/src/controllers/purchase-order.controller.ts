import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { PurchaseOrder } from '../database/entities/purchase-order.entity';
import { PurchaseOrderService } from '../services/purchase-order.service';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    return this.purchaseOrderService.create(createPurchaseOrderDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('supplierId', new ParseIntPipe({ optional: true })) supplierId?: number,
    @Query('segmentId', new ParseIntPipe({ optional: true })) segmentId?: number,
    @Query('projectId', new ParseIntPipe({ optional: true })) projectId?: number,
    @Query('month') month?: string,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderService.findAll({ status, supplierId, segmentId, projectId, month });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrder> {
    return this.purchaseOrderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.update(id, updatePurchaseOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.purchaseOrderService.remove(id);
  }
}
