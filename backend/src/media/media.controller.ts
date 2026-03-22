import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user.type';
import { MediaService } from './media.service';

const MEDIA_DIR = resolve(process.cwd(), 'storage', 'videos');

if (!existsSync(MEDIA_DIR)) {
  mkdirSync(MEDIA_DIR, { recursive: true });
}

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('instructor/uploads/video')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: MEDIA_DIR,
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2 GB
      },
    }),
  )
  uploadVideo(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile()
    file: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    return this.mediaService.registerUploadedVideo(user.userId, file);
  }

  @Get('media/:assetId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN)
  async getAssetMeta(@Param('assetId') assetId: string) {
    const asset = await this.mediaService.getAssetOrThrow(assetId);
    return {
      ...asset,
      streamUrl: `/api/v1/media/stream/${asset.id}`,
    };
  }

  @Get('media/stream/:assetId')
  async streamVideo(
    @Param('assetId') assetId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const asset = await this.mediaService.getAssetOrThrow(assetId);
    const filePath = join(MEDIA_DIR, asset.storageKey);
    if (!existsSync(filePath)) {
      throw new NotFoundException({
        code: 'MEDIA_FILE_NOT_FOUND',
        message: 'Media file missing from storage',
      });
    }

    const stats = statSync(filePath);
    const fileSize = stats.size;
    const range = req.headers.range;

    if (!range) {
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Content-Length', fileSize.toString());
      createReadStream(filePath).pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = Number(parts[0]);
    const end = parts[1] ? Number(parts[1]) : fileSize - 1;
    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });

    res.status(206);
    res.set({
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize.toString(),
      'Content-Type': asset.mimeType,
    });
    stream.pipe(res);
  }
}
