import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportesService } from './reportes.service';

@Controller('report')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}
  @Post('to/:codigo')
  createReport(
    @Param('codigo') codigo: string,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportesService.createReport(createReportDto, codigo);
  }

  @Get()
  getAllReports() {
    return this.reportesService.getAllReports();
  }

  @Get('unsolved')
  getAllUnsolved() {
    return this.reportesService.getAllUnsolved();
  }

  @Patch('resolve/:idReport')
  resolveReport(@Param('idReport') idReporte: string) {
    return this.reportesService.resolveReport(idReporte);
  }
}