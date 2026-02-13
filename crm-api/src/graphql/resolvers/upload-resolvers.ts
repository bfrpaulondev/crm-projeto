// =============================================================================
// Upload Resolvers
// =============================================================================

import { builder } from '../schema/builder.js';
import { uploadService } from '@/services/upload.service.js';

// Attachment Type
builder.simpleObject('Attachment', {
  fields: (t) => ({
    id: t.string(),
    filename: t.string(),
    mimeType: t.string(),
    size: t.int(),
    url: t.string(),
  }),
});

// Upload Result
builder.simpleObject('UploadResult', {
  fields: (t) => ({
    id: t.string(),
    filename: t.string(),
    mimeType: t.string(),
    size: t.int(),
    url: t.string(),
  }),
});

// Upload Mutation
builder.mutationField('uploadFile', (t) => ({
  type: 'UploadResult',
  args: {
    file: t.arg.string({ required: true }),
    relatedToType: t.arg.string({ required: false }),
    relatedToId: t.arg.string({ required: false }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant || !ctx.user) {
      throw new Error('Authentication required');
    }

    // In a real app, file would come from multipart upload
    const result = await uploadService.uploadFile(
      ctx.tenant.id,
      ctx.user.id,
      {
        filename: args.file,
        mimetype: 'application/octet-stream',
        data: Buffer.from(''),
      },
      args.relatedToType ?? undefined,
      args.relatedToId ?? undefined
    );

    return result;
  },
}));

// Delete Attachment Mutation
builder.mutationField('deleteAttachment', (t) => ({
  type: 'Boolean',
  args: {
    id: t.arg.string({ required: true }),
  },
  resolve: async (_parent, args, ctx) => {
    if (!ctx.tenant) {
      throw new Error('Tenant required');
    }

    return uploadService.deleteFile(args.id, ctx.tenant.id);
  },
}));
