import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { UsersModule } from 'src/users/users.module';
import { ReportesService } from './reportes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities';
import { Report } from './entities';
import { UsersService } from 'src/users/users.service';
import { UploadModule } from 'src/upload/upload.module';
import { UploadService } from 'src/upload/upload.service';
import { CredencialesModule } from 'src/credenciales/credenciales.module';
import { Book } from 'src/books/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Report, Book]),
    UsersModule,
    UploadModule,
    CredencialesModule,
  ],
  controllers: [ReportesController],
  providers: [ReportesService, UsersService, UploadService], // Incluye UsersService en providers
})
export class ReportesModule {}