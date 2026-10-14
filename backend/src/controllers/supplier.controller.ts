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
import { CreateSupplierDto, UpdateSupplierDto } from '../dto/supplier.dto';
import { Supplier } from '../database/entities/supplier.entity';
import { SupplierService } from '../services/supplier.service';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  findAll(@Query('search') search?: string): Promise<Supplier[]> {
    return this.supplierService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Supplier> {
    return this.supplierService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.supplierService.remove(id);
  }
}
