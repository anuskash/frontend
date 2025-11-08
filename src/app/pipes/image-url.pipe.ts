import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * imageUrl pipe
 * - If the input is an absolute URL (http/https), return as-is
 * - If it's a relative path (e.g., /uploads/xyz.jpg), prefix with environment.baseUrl
 * - If empty/falsy, return '' so templates can fallback with || placeholder
 */
@Pipe({ name: 'imageUrl', standalone: true })
export class ImageUrlPipe implements PipeTransform {
  transform(url?: string | null): string {
    if (!url) return '';

    const str = String(url).trim();
    if (!str) return '';

    // Already absolute
    if (/^https?:\/\//i.test(str)) return str;

    const base = (environment.baseUrl || '').replace(/\/$/, '');
    if (str.startsWith('/')) return `${base}${str}`;
    return `${base}/${str}`;
  }
}
