import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call login endpoint', () => {
    const mockCredentials: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockResponse: LoginResponse = {
      userId: 1,
      role: 'user',
      passwordHash: null,
      status: 'active',
      email: 'test@example.com',
      createdAt: '2025-10-31T17:31:11.742816'
    };

    service.login(mockCredentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne((request) => {
      return request.url === `${environment.baseUrl}/auth/login` &&
             request.params.get('email') === mockCredentials.email &&
             request.params.get('password') === mockCredentials.password;
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should store and retrieve user data', () => {
    const mockUser: LoginResponse = {
      userId: 1,
      role: 'user',
      passwordHash: null,
      status: 'active',
      email: 'test@example.com',
      createdAt: '2025-10-31T17:31:11.742816'
    };
    
    service.setCurrentUser(mockUser);
    expect(service.getCurrentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBeTruthy();

    service.removeCurrentUser();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('should call logout endpoint', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne(`${environment.baseUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});