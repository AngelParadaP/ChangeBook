import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exchange } from './exchange.entity';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(Exchange)
    private readonly exchangeRepository: Repository<Exchange>,
  ) {}

  create(exchange: Exchange): Promise<Exchange> {
    return this.exchangeRepository.save(exchange);
  }

  findAll(): Promise<Exchange[]> {
    return this.exchangeRepository.find();
  }

  findOne(id: string): Promise<Exchange> {
    return this.exchangeRepository.findOneBy({ id });
  }

  async update(id: string, aceptado: boolean): Promise<Exchange> {
    const exchange = await this.exchangeRepository.findOneBy({ id });
    if (exchange) {
      exchange.aceptado = aceptado;
      return this.exchangeRepository.save(exchange);
    }
    return null;
  }

  async remove(id: string): Promise<void> {
    await this.exchangeRepository.delete(id);
  }

  findPending(usuarioReceptor: string): Promise<Exchange[]> {
    return this.exchangeRepository.find({
      where: { usuarioReceptor, aceptado: false },
    });
  }

    findActive(usuarioReceptor: string): Promise<Exchange[]> {
    return this.exchangeRepository.find({
      where: { usuarioReceptor, aceptado: true },
    });
  }
}
