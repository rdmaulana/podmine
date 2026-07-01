import { Controller, Post, Get, Body, Param, Query, UseGuards, Res, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { PodcastService } from './podcast.service';
import { GeneratePodcastDto, PodcastQueryDto } from './dto/podcast.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/current-user.decorator';

@ApiTags('Podcasts')
@Controller('podcasts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PodcastController {
  constructor(private readonly podcastService: PodcastService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger AI podcast generation' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: 'Podcast generation task queued' })
  async generate(
    @Body() dto: GeneratePodcastDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.podcastService.generate(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user podcasts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of user podcasts returned successfully' })
  async findAll(
    @Query() query: PodcastQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.podcastService.findAll(query, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get podcast detail/status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Podcast details returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Podcast not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.podcastService.findOne(id, user.userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download generated podcast file (redirects to Cloudflare R2 presigned URL)' })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Redirecting to presigned download URL' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Podcast or audio file not found' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Res() res: any,
  ) {
    const downloadUrl = await this.podcastService.getDownloadUrl(id, user.userId);
    return res.redirect(HttpStatus.FOUND, downloadUrl);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream generated podcast audio supporting range requests' })
  @ApiQuery({ name: 'token', required: false, description: 'Access token can be passed in query for HTML5 players' })
  @ApiResponse({ status: HttpStatus.PARTIAL_CONTENT, description: 'Partial audio stream content chunk' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Complete audio stream' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Podcast or audio file not found' })
  async stream(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: any,
  ) {
    const range = req.headers.range;
    const { stream, contentType, contentLength, contentRange } = await this.podcastService.getStream(
      id,
      user.userId,
      range,
    );

    // Set standard response headers
    res.setHeader('Accept-Ranges', 'bytes');
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    
    if (range && contentRange) {
      res.setHeader('Content-Range', contentRange);
      res.status(HttpStatus.PARTIAL_CONTENT);
    } else {
      res.status(HttpStatus.OK);
    }

    // Pipe the S3 response body stream directly into Express response object
    if (stream && typeof (stream as any).pipe === 'function') {
      (stream as any).pipe(res);
    } else if (stream && typeof (stream as any).transformToByteArray === 'function') {
      // S3 SDK v3 returns ReadableStream for Browser, but body has transformToByteArray or pipe in Node environment
      const buffer = await (stream as any).transformToByteArray();
      res.end(Buffer.from(buffer));
    } else {
      res.end();
    }
  }
}
