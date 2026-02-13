// =============================================================================
// Upload Service
// =============================================================================

import { attachmentRepository } from '@/repositories/attachment.repository.js';
import { logger } from '@/infrastructure/logging/index.js';
import { traceServiceOperation } from '@/infrastructure/otel/tracing.js';
import { config } from '@/config/index.js';
import { StorageType, RelatedToType } from '@/types/entities.js';
import * as fs from 'fs';
import * as path from 'path';

interface UploadResult {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export class UploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedTypes: string[];

  constructor() {
    this.uploadDir = config.UPLOAD_DIR || './uploads';
    this.maxFileSize = config.MAX_FILE_SIZE || 10485760; // 10MB
    this.allowedTypes = (config.ALLOWED_FILE_TYPES || '').split(',');

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    tenantId: string,
    userId: string,
    file: {
      filename: string;
      mimetype: string;
      data: Buffer;
    },
    relatedToType?: string,
    relatedToId?: string
  ): Promise<UploadResult> {
    return traceServiceOperation('UploadService', 'uploadFile', async () => {
      // Validate file size
      if (file.data.length > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed: ${this.maxFileSize} bytes`);
      }

      // Validate file type
      if (!this.allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type not allowed: ${file.mimetype}`);
      }

      // Generate unique filename
      const ext = path.extname(file.filename);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filePath = path.join(this.uploadDir, uniqueName);

      // Save file
      await fs.promises.writeFile(filePath, file.data);

      // Determine relatedToType
      let relatedType = RelatedToType.LEAD;
      if (relatedToType === 'CONTACT') relatedType = RelatedToType.CONTACT;
      else if (relatedToType === 'ACCOUNT') relatedType = RelatedToType.ACCOUNT;
      else if (relatedToType === 'OPPORTUNITY') relatedType = RelatedToType.OPPORTUNITY;

      // Create attachment record
      const attachment = await attachmentRepository.create({
        tenantId,
        fileName: file.filename,
        originalName: file.filename,
        mimeType: file.mimetype,
        size: file.data.length,
        url: `/uploads/${uniqueName}`,
        storageType: StorageType.LOCAL,
        storageKey: uniqueName,
        relatedToType: relatedType,
        relatedToId: relatedToId || '',
        uploadedBy: userId,
        description: null,
        isAvatar: false,
        metadata: null,
        createdBy: userId,
      });

      logger.info('File uploaded', {
        attachmentId: attachment._id.toHexString(),
        filename: file.filename,
        size: file.data.length,
        tenantId,
        userId,
      });

      return {
        id: attachment._id.toHexString(),
        filename: attachment.fileName,
        mimeType: file.mimetype,
        size: file.data.length,
        url: `/uploads/${uniqueName}`,
      };
    });
  }

  async deleteFile(id: string, tenantId: string): Promise<boolean> {
    return traceServiceOperation('UploadService', 'deleteFile', async () => {
      const attachment = await attachmentRepository.findById(id, tenantId);

      if (!attachment) {
        return false;
      }

      // Delete file from disk
      try {
        const filePath = path.join(this.uploadDir, attachment.storageKey);
        await fs.promises.unlink(filePath);
      } catch (error) {
        logger.warn('Failed to delete file from disk', {
          storageKey: attachment.storageKey,
          error: String(error),
        });
      }

      // Delete from database
      await attachmentRepository.deleteById(id, tenantId);

      logger.info('File deleted', { attachmentId: id, tenantId });

      return true;
    });
  }

  async getFile(id: string, tenantId: string): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  } | null> {
    const attachment = await attachmentRepository.findById(id, tenantId);

    if (!attachment) {
      return null;
    }

    const filePath = path.join(this.uploadDir, attachment.storageKey);
    const data = await fs.promises.readFile(filePath);

    return {
      data,
      filename: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }
}

export const uploadService = new UploadService();
