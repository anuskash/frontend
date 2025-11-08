import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { 
  MarketPlaceProductRequest,
  SellerReviewRequest,
  BuyerReviewRequest 
} from '../models/product.model';

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
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Profile Endpoints', () => {
    it('should get user profile', () => {
      const mockProfile = {
        profileId: 1,
        userId: 123,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+61 123 456 789',
        profileImageUrl: 'https://example.com/profile.jpg'
      };

      service.getUserProfile(123).subscribe(profile => {
        expect(profile).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/users/profile/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);
    });

    it('should update profile picture', () => {
      const mockProfile = { profileId: 1, userId: 123, firstName: 'John', lastName: 'Doe' };
      const newImageUrl = 'https://example.com/new-profile.jpg';

      service.updateProfilePicture(123, newImageUrl).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.baseUrl}/users/profile/123/picture` &&
               request.params.get('newProfileImageUrl') === newImageUrl;
      });
      expect(req.request.method).toBe('PUT');
      req.flush(mockProfile);
    });
  });

  describe('Product Endpoints', () => {
    it('should add product', () => {
      const productRequest: MarketPlaceProductRequest = {
        sellerId: 123,
        productName: 'Test Product',
        productDescription: 'Test Description',
        price: 99.99,
        condition: 'new',
        category: 'electronics',
        productImageUrl: 'https://example.com/product.jpg'
      };

      service.addProduct(productRequest).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/users/product`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(productRequest);
      req.flush({});
    });

    it('should get available products', () => {
      service.getAvailableProducts().subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/users/products/available`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('Review Endpoints', () => {
    it('should add seller review', () => {
      const reviewRequest: SellerReviewRequest = {
        reviewerId: 456,
        sellerId: 123,
        rating: 5,
        productId: 789,
        reviewText: 'Great seller!'
      };

      service.addSellerReview(reviewRequest).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/users/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reviewRequest);
      req.flush({});
    });

    it('should add buyer review', () => {
      const reviewRequest: BuyerReviewRequest = {
        reviewerId: 123,
        buyerId: 456,
        rating: 4,
        productId: 789,
        reviewText: 'Good buyer!'
      };

      service.addBuyerReview(reviewRequest).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/users/buyer-reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reviewRequest);
      req.flush({});
    });
  });
});