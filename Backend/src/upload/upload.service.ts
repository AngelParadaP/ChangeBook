import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageTitleDto } from 'src/books/dto/image-title.dto';
import { UserImageInsertDto } from 'src/users/dto/image-insert.dto';

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
  });

  constructor(private readonly configService: ConfigService) {}

  async upload(imageTitleDto: ImageTitleDto, file: Buffer) {
    let fileName: string;

    if (imageTitleDto.titulo) {
      // Si se proporciona un título, usa el código y el título en el nombre del archivo
      const spaceLessTitle = imageTitleDto.titulo.replaceAll(' ', '-');
      fileName = `${imageTitleDto.codigo}-libro-${spaceLessTitle}`;
    } else {
      // Si no se proporciona un título, usa solo el código en el nombre del archivo
      fileName = `${imageTitleDto.codigo}-imagenCredencial`;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: 'image.bucket.for.cbook.webapp.20112004',
        Key: fileName,
        Body: file,
      }),
    );

    const url = `https://s3.us-east-2.amazonaws.com/image.bucket.for.cbook.webapp.20112004/${fileName}`; // Cambia 'your-bucket' por el nombre de tu bucket

    // Puedes devolver la URL aquí o almacenarla en tu base de datos
    return url;
  }

  async uploadUserImages(imageTitleDto: UserImageInsertDto, file: Buffer) {
    let fileName: string;

    if (imageTitleDto.credencial) {
      fileName = `${imageTitleDto.codigo}-imagenCredencial`;
    } else {
      fileName = `${imageTitleDto.codigo}-imagenPerfil`;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: 'image.bucket.for.cbook.webapp.20112004',
        Key: fileName,
        Body: file,
      }),
    );

    const url = `https://s3.us-east-2.amazonaws.com/image.bucket.for.cbook.webapp.20112004/${fileName}`; // Cambia 'your-bucket' por el nombre de tu bucket

    // Puedes devolver la URL aquí o almacenarla en tu base de datos
    return url;
  }
}
