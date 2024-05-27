import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exchange } from './exchange.entity';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Exchange])],
  providers: [ExchangeService],
  controllers: [ExchangeController],
})
export class ExchangeModule {}
