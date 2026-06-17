import { validateVerificationImage } from './identityValidation';

export async function validateFaceInImage(file) {
  const imageCheck = await validateVerificationImage(file, {
    minWidth: 240,
    minHeight: 240,
    maxMb: 5,
  });
  if (!imageCheck.valid) {
    return { valid: false, message: imageCheck.message, faceDetected: false };
  }

  if (typeof globalThis.FaceDetector === 'undefined') {
    return {
      valid: true,
      faceDetected: null,
      message: 'Photo accepted. Use a clear, front-facing image for hotel check-in.',
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const detector = new globalThis.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
    const faces = await detector.detect(bitmap);
    bitmap.close();

    if (faces.length === 0) {
      return {
        valid: false,
        faceDetected: false,
        message: 'No face detected. Upload a clear photo showing the guest\'s face.',
      };
    }
    if (faces.length > 1) {
      return {
        valid: false,
        faceDetected: false,
        message: 'Multiple faces detected. Upload a photo with only the person checking in.',
      };
    }
    return { valid: true, faceDetected: true, message: 'Face detected successfully.' };
  } catch {
    return {
      valid: true,
      faceDetected: null,
      message: 'Photo accepted. Ensure it is a clear, front-facing image for check-in.',
    };
  }
}
