import { Controller, Get, Query } from '@nestjs/common';
import { DashboardDto, DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** `?month=YYYY-MM` additionally includes the budget planned vs. realized indicator. */
  @Get()
  summary(@Query('month') month?: string): Promise<DashboardDto> {
    return this.dashboardService.summary(month);
  }
}
