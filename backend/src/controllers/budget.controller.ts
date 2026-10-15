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
import { CreateBudgetDto, CreateMonthlyBudgetDto, UpdateBudgetDto } from '../dto/budget.dto';
import { Budget } from '../database/entities/budget.entity';
import { BudgetIndicatorDto, BudgetService } from '../services/budget.service';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(@Body() createBudgetDto: CreateBudgetDto): Promise<Budget> {
    return this.budgetService.create(createBudgetDto);
  }

  @Post('monthly')
  createMonthly(
    @Body() createMonthlyBudgetDto: CreateMonthlyBudgetDto,
  ): Promise<Budget[]> {
    return this.budgetService.createMonthly(createMonthlyBudgetDto);
  }

  /** `?month=YYYY-MM` filters by month. */
  @Get()
  findAll(@Query('month') month?: string): Promise<Budget[]> {
    return this.budgetService.findAll(month);
  }

  /** Planned vs. realized per week of the month. Declared before ':id'. */
  @Get('indicator')
  indicator(@Query('month') month: string): Promise<BudgetIndicatorDto> {
    return this.budgetService.indicator(month);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Budget> {
    return this.budgetService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    return this.budgetService.update(id, updateBudgetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.budgetService.remove(id);
  }
}
