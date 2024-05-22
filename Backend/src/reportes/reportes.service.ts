import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Report) private reportRepository: Repository<Report>,
    private usersService: UsersService,
  ) {}

  async createReport(createReportDto: CreateReportDto, codigo: string) {
    try {
      const user = await this.usersService.findOne(codigo);

      if (!user) {
        throw new NotFoundException('User not found in database');
      }

      const report = new Report();
      report.descripcion = createReportDto.descripcion;
      report.codigo_remitente = createReportDto.codigo_remitente;
      report.user = user;

      return await this.reportRepository.save(report);
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to create report',
        err,
      );
    }
  }

  async getAllReports() {
    try {
      return await this.reportRepository.find({
        relations: {
          user: true,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to retrieve all reports',
        err,
      );
    }
  }

  async getAllUnsolved() {
    try {
      return await this.reportRepository.find({
        where: {
          resuelto: false,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to retrieve all reports',
        err,
      );
    }
  }

  async resolveReport(idReporte: string) {
    console.log(idReporte)
    try {
      const reporte = await this.reportRepository.findOne({
        where: {
          idReporte,
        },
      });

      if (!reporte) {
        throw new NotFoundException('Report not found in database');
      }

      reporte.resuelto = true;

      return await this.reportRepository.save(reporte);
    } catch (err) {
      throw new InternalServerErrorException(
        'Server failed to retrieve all reports',
        err,
      );
    }
  }
}