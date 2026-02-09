import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';

// Mock the environment module
vi.mock('../../environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    mockApi: true
  }
}));

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('should return mock profile when mockApi is true', () => {
    // environment.mockApi is forced true by vi.mock 

    let profile: any;
    service.getProfile('123').subscribe(p => profile = p);
    
    vi.advanceTimersByTime(800);
    
    expect(profile).toBeDefined();
    expect(profile.firstName).toBe('Mock');
  });

  it('should update mock profile when mockApi is true', () => {
    // environment.mockApi is forced true by vi.mock

    let profile: any;
    service.updateProfile('123', { firstName: 'Updated' }).subscribe(p => profile = p);

    vi.advanceTimersByTime(1000);

    expect(profile).toBeDefined();
    expect(profile.firstName).toBe('Updated');
  });
});
