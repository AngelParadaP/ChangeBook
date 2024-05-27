import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { Exchange } from './exchange.entity';

@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Post()
  create(@Body() exchange: Exchange): Promise<Exchange> {
    return this.exchangeService.create(exchange);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Exchange> {
    return this.exchangeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body('aceptado') aceptado: boolean): Promise<Exchange> {
    return this.exchangeService.update(id, aceptado);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.exchangeService.remove(id);
  }

    @Get('pending/:usuarioReceptor')
  findPending(@Param('usuarioReceptor') usuarioReceptor: string): Promise<Exchange[]> {
    return this.exchangeService.findPending(usuarioReceptor);
  }

      @Get('active/:usuarioReceptor')
  findActive(@Param('usuarioReceptor') usuarioReceptor: string): Promise<Exchange[]> {
    return this.exchangeService.findPending(usuarioReceptor);
  }
}

