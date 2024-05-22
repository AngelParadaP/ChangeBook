import {
  Controller,
  ParseFilePipe,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ImageTitleDto } from 'src/books/dto/image-title.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2097152 })],
      }),
    )
    file: Express.Multer.File,
    @Body() imageTitleDto: ImageTitleDto,
  ) {
    const url = await this.uploadService.upload(imageTitleDto, file.buffer);

    // Puedes hacer algo con la URL aquí, como devolverla como parte de la respuesta o almacenarla en tu base de datos
    return { url };
  }
}
