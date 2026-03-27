import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Resolve videos directory — check both public/videos and src relative paths
function getVideosDir(): string {
  const candidates = [
    path.resolve(__dirname, '../../public/videos'),
    path.resolve('public/videos'),
    path.resolve('apps/api/public/videos'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  // Default — create if needed
  const defaultDir = path.resolve(__dirname, '../../public/videos');
  return defaultDir;
}

const VIDEOS_DIR = getVideosDir();

/**
 * @openapi
 * /videos/{filename}:
 *   get:
 *     tags: [Videos]
 *     summary: Stream video file with Range support
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *         example: intro.mp4
 *     responses:
 *       200: { description: Full video file }
 *       206: { description: Partial content (Range request) }
 *       404: { description: Video not found }
 */
router.get('/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;

  // Sanitize filename
  if (!/^[\w.-]+$/.test(filename)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_FILENAME', message: 'Invalid filename' } });
    return;
  }

  const filePath = path.join(VIDEOS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: { code: 'VIDEO_NOT_FOUND', message: 'Video file not found' } });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });

    fs.createReadStream(filePath).pipe(res);
  }
});

export { router as videosRouter };
