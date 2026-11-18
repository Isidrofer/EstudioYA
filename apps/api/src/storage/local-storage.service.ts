import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { notFound } from '../common/api-problem';
import { StorageService } from './storage.service';

/** Guarda los archivos en una carpeta del disco (STORAGE_DIR, por defecto ./storage). Solo desarrollo. */
@Injectable()
export class LocalStorageService extends StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    super();
    this.root = resolve(config.get<string>('STORAGE_DIR') ?? './storage');
  }

  /** Resuelve la ruta y evita salir de la carpeta raíz (path traversal). */
  private pathFor(key: string): string {
    const full = resolve(this.root, key);
    if (!full.startsWith(this.root + sep)) throw new Error(`Clave de almacenamiento inválida: ${key}`);
    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async getStream(key: string): Promise<Readable> {
    const path = this.pathFor(key);
    try {
      await stat(path);
    } catch {
      throw notFound('El archivo no está disponible.');
    }
    return createReadStream(path);
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}
