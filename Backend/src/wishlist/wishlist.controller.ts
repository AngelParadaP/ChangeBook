import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('anadirLibro')
  create(@Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistService.create(createWishlistDto);
  }

  @Get('userWishList/:codigo')
  findUserWishList(@Param('codigo') codigo: string) {
    return this.wishlistService.findUserWishList(codigo);
  }

  @Delete('borrarLibro')
  borrar(@Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistService.borrar(createWishlistDto);
  }
}
