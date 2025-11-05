import { Router } from 'express';
import { upload, uploadService } from '@/services/UploadService';
import { authenticate } from '@/middlewares/auth';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

/**
 * @route   POST /api/uploads/image
 * @desc    Upload a single image
 * @access  Private
 */
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem foi enviada',
      });
    }

    const imageUrl = uploadService.getFileUrl(req.file.filename);

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  })
);

/**
 * @route   DELETE /api/uploads/:filename
 * @desc    Delete an uploaded file
 * @access  Private
 */
router.delete(
  '/:filename',
  authenticate,
  asyncHandler(async (req, res) => {
    const { filename } = req.params;

    await uploadService.deleteFile(filename);

    res.status(200).json({
      success: true,
      message: 'Arquivo excluído com sucesso',
    });
  })
);

export default router;
