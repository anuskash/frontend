import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SingleUploadResponse {
  imageUrl: string;
  message: string;
}

export interface MultiUploadResponse {
  imageUrls: string[];
  count: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private base = environment.baseUrl; // keep consistent with existing services
  private endpoints = environment.endpoints?.users || ({} as any);
  private withCreds = (environment as any)?.withCredentials === true;

  constructor(private http: HttpClient) {}

  uploadSingle(file: File, reportProgress = true): Observable<HttpEvent<SingleUploadResponse>> {
    const form = new FormData();
    // Backend contract: @RequestPart("file") MultipartFile (single)
    form.append('file', file);
    const path = this.endpoints.uploadSingleImage || '/users/product/upload-image';
    const req = new HttpRequest('POST', `${this.base}${path}`, form, {
      reportProgress,
      withCredentials: this.withCreds,
    });
    return this.http.request<SingleUploadResponse>(req);
  }

  uploadMultiple(files: File[] | FileList, reportProgress = true): Observable<HttpEvent<MultiUploadResponse>> {
    const form = new FormData();
    // Backend contract: @RequestPart("files") MultipartFile[] (multiple)
    Array.from(files as File[]).forEach((f) => form.append('files', f));
    const path = this.endpoints.uploadMultipleImages || '/users/product/upload-multiple-images';
    const req = new HttpRequest('POST', `${this.base}${path}`, form, {
      reportProgress,
      withCredentials: this.withCreds,
    });
    return this.http.request<MultiUploadResponse>(req);
  }

  deleteImage(imageUrl: string) {
    const url = `${this.base}/users/product/delete-image`;
    return this.http.delete(url, { params: { imageUrl } });
  }
}
