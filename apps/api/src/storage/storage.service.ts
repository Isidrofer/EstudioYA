import type { Readable } from 'node:stream';

/**
 * Almacenamiento de archivos privados (documentos de verificación).
 * Hoy se implementa en disco local (LocalStorageService); para producción se reemplaza por una
 * implementación S3-compatible (Cloudflare R2) sin tocar el resto del código.
 */
export abstract class StorageService {
  abstract put(key: string, data: Buffer): Promise<void>;
  /** Lanza `notFound()` si el archivo no existe. */
  abstract getStream(key: string): Promise<Readable>;
  /** No falla si el archivo no existe. */
  abstract delete(key: string): Promise<void>;
}
