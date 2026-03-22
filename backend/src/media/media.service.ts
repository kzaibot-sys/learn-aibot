import {
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { MediaAssetType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async registerUploadedVideo(
    userId: string,
    file: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    if (!file.mimetype.startsWith('video/')) {
      throw new UnsupportedMediaTypeException({
        code: 'MEDIA_TYPE_NOT_SUPPORTED',
        message: 'Only video upload is supported for this endpoint',
      });
    }

    const asset = await this.prisma.mediaAsset.create({
      data: {
        type: MediaAssetType.VIDEO,
        storageKey: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: userId,
      },
      select: {
        id: true,
        type: true,
        storageKey: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return {
      ...asset,
      streamUrl: `/api/v1/media/stream/${asset.id}`,
    };
  }

  async getAssetOrThrow(assetId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        type: true,
        storageKey: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        uploadedById: true,
        createdAt: true,
      },
    });
    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_ASSET_NOT_FOUND',
        message: 'Media asset not found',
      });
    }
    return asset;
  }
}
