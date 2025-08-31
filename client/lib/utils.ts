// lib/utils.ts
import { Stream } from 'stream';

// function converts a file stream into a raw data buffer.
export function streamToBuffer(stream: Stream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// function takes the buffer and converts it into a Data URL
export async function streamToDataURL(stream: Stream, mimeType: string): Promise<string> {
  const buffer = await streamToBuffer(stream);
  const base64String = buffer.toString('base64');
  return `data:${mimeType};base64,${base64String}`;
}
