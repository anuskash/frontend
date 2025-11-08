# Backend Fix Required: Prohibited Keywords API

## Issue
The admin settings page cannot add prohibited keywords. The frontend is getting an error when calling `POST /admin/prohibited-keywords`.

## Root Cause Analysis
Based on the error "Failed to add keyword", the backend endpoint is likely:
1. **Not implemented yet**, OR
2. **Returning an error** due to validation/authorization issues

## Expected Backend Implementation

### Endpoint: POST /admin/prohibited-keywords

**URL**: `POST /admin/prohibited-keywords`

**Headers Required**:
```
Authorization: Bearer <token>
X-User-Id: <adminUserId>  (or userId header as configured)
Content-Type: application/json
```

**Request Body**:
```json
{
  "keyword": "ganja",
  "category": "drugs",
  "severity": "HIGH",
  "autoAction": "REJECT"
}
```

**Field Details**:
- `keyword` (String, required, min 2 chars): The prohibited word/phrase
- `category` (String, optional): Category classification (drugs, weapons, alcohol, tobacco, profanity, scam_indicators)
- `severity` (String, required): LOW, MEDIUM, or HIGH
- `autoAction` (String, required): WARN, FLAG, or REJECT

**Response (201 Created)**:
```json
{
  "id": 1,
  "keyword": "ganja",
  "category": "drugs",
  "severity": "HIGH",
  "autoAction": "REJECT"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid auth token
- `403 Forbidden`: User is not an admin
- `409 Conflict`: Keyword already exists (duplicate)
- `400 Bad Request`: Missing required fields or invalid values

---

## Database Schema

If the table doesn't exist yet:

```sql
CREATE TABLE prohibited_keywords (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    auto_action VARCHAR(20) NOT NULL DEFAULT 'FLAG',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_admin_id BIGINT,
    UNIQUE KEY unique_keyword (keyword),
    INDEX idx_category (category),
    INDEX idx_severity (severity),
    FOREIGN KEY (created_by_admin_id) REFERENCES users(user_id)
);
```

---

## Backend Controller Implementation (Spring Boot Example)

### ProhibitedKeywordController.java

```java
@RestController
@RequestMapping("/admin/prohibited-keywords")
public class ProhibitedKeywordController {
    
    @Autowired
    private ProhibitedKeywordService keywordService;
    
    @Autowired
    private AuthService authService;
    
    /**
     * GET /admin/prohibited-keywords
     * Retrieve all prohibited keywords
     */
    @GetMapping
    public ResponseEntity<List<ProhibitedKeywordDTO>> getAllKeywords(
            @RequestHeader("userId") Long adminUserId) {
        
        // Verify admin role
        if (!authService.isAdmin(adminUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<ProhibitedKeywordDTO> keywords = keywordService.getAllKeywords();
        return ResponseEntity.ok(keywords);
    }
    
    /**
     * POST /admin/prohibited-keywords
     * Add a new prohibited keyword
     */
    @PostMapping
    public ResponseEntity<?> addKeyword(
            @RequestHeader("userId") Long adminUserId,
            @Valid @RequestBody CreateProhibitedKeywordRequest request) {
        
        // Verify admin role
        if (!authService.isAdmin(adminUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Admin access required");
        }
        
        // Check for duplicate
        if (keywordService.existsByKeyword(request.getKeyword())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Keyword already exists");
        }
        
        // Validate required fields
        if (request.getKeyword() == null || request.getKeyword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Keyword is required");
        }
        
        if (request.getSeverity() == null) {
            return ResponseEntity.badRequest().body("Severity is required");
        }
        
        if (request.getAutoAction() == null) {
            return ResponseEntity.badRequest().body("Auto action is required");
        }
        
        try {
            ProhibitedKeywordDTO saved = keywordService.addKeyword(request, adminUserId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to add keyword: " + e.getMessage());
        }
    }
    
    /**
     * DELETE /admin/prohibited-keywords/{id}
     * Delete a prohibited keyword
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteKeyword(
            @RequestHeader("userId") Long adminUserId,
            @PathVariable Long id) {
        
        // Verify admin role
        if (!authService.isAdmin(adminUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Admin access required");
        }
        
        if (!keywordService.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Keyword not found");
        }
        
        keywordService.deleteKeyword(id);
        return ResponseEntity.ok("Keyword deleted successfully");
    }
}
```

### CreateProhibitedKeywordRequest.java (DTO)

```java
public class CreateProhibitedKeywordRequest {
    
    @NotBlank(message = "Keyword is required")
    @Size(min = 2, max = 100, message = "Keyword must be between 2 and 100 characters")
    private String keyword;
    
    @Size(max = 50)
    private String category;
    
    @NotNull(message = "Severity is required")
    @Pattern(regexp = "LOW|MEDIUM|HIGH", message = "Severity must be LOW, MEDIUM, or HIGH")
    private String severity;
    
    @NotNull(message = "Auto action is required")
    @Pattern(regexp = "WARN|FLAG|REJECT", message = "Auto action must be WARN, FLAG, or REJECT")
    private String autoAction;
    
    // Getters and setters
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getAutoAction() { return autoAction; }
    public void setAutoAction(String autoAction) { this.autoAction = autoAction; }
}
```

### ProhibitedKeywordDTO.java (Response)

```java
public class ProhibitedKeywordDTO {
    private Long id;
    private String keyword;
    private String category;
    private String severity;
    private String autoAction;
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getAutoAction() { return autoAction; }
    public void setAutoAction(String autoAction) { this.autoAction = autoAction; }
}
```

### ProhibitedKeyword.java (Entity)

```java
@Entity
@Table(name = "prohibited_keywords")
public class ProhibitedKeyword {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 100)
    private String keyword;
    
    @Column(length = 50)
    private String category;
    
    @Column(nullable = false, length = 20)
    private String severity = "MEDIUM";
    
    @Column(name = "auto_action", nullable = false, length = 20)
    private String autoAction = "FLAG";
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "created_by_admin_id")
    private Long createdByAdminId;
    
    // Getters and setters
    // ... (generate all)
}
```

### ProhibitedKeywordRepository.java

```java
@Repository
public interface ProhibitedKeywordRepository extends JpaRepository<ProhibitedKeyword, Long> {
    
    boolean existsByKeywordIgnoreCase(String keyword);
    
    Optional<ProhibitedKeyword> findByKeywordIgnoreCase(String keyword);
    
    List<ProhibitedKeyword> findByCategory(String category);
    
    List<ProhibitedKeyword> findBySeverity(String severity);
}
```

### ProhibitedKeywordService.java

```java
@Service
public class ProhibitedKeywordService {
    
    @Autowired
    private ProhibitedKeywordRepository repository;
    
    public List<ProhibitedKeywordDTO> getAllKeywords() {
        return repository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    public boolean existsByKeyword(String keyword) {
        return repository.existsByKeywordIgnoreCase(keyword.trim());
    }
    
    public boolean existsById(Long id) {
        return repository.existsById(id);
    }
    
    public ProhibitedKeywordDTO addKeyword(CreateProhibitedKeywordRequest request, Long adminUserId) {
        ProhibitedKeyword entity = new ProhibitedKeyword();
        entity.setKeyword(request.getKeyword().trim().toLowerCase());
        entity.setCategory(request.getCategory());
        entity.setSeverity(request.getSeverity());
        entity.setAutoAction(request.getAutoAction());
        entity.setCreatedByAdminId(adminUserId);
        entity.setCreatedAt(LocalDateTime.now());
        
        ProhibitedKeyword saved = repository.save(entity);
        return toDTO(saved);
    }
    
    public void deleteKeyword(Long id) {
        repository.deleteById(id);
    }
    
    private ProhibitedKeywordDTO toDTO(ProhibitedKeyword entity) {
        ProhibitedKeywordDTO dto = new ProhibitedKeywordDTO();
        dto.setId(entity.getId());
        dto.setKeyword(entity.getKeyword());
        dto.setCategory(entity.getCategory());
        dto.setSeverity(entity.getSeverity());
        dto.setAutoAction(entity.getAutoAction());
        return dto;
    }
}
```

---

## Frontend Changes Made

The frontend has been updated to:

1. **Trim and validate keyword input** before sending
2. **Check for duplicates client-side** to prevent unnecessary API calls
3. **Handle empty category** properly (sends undefined instead of empty string)
4. **Improved error messages** showing specific error details:
   - Duplicate keyword
   - Unauthorized access
   - Validation errors
   - Backend error messages

5. **Added console logging** in admin.service.ts to debug payload being sent

---

## Testing the Fix

### Step 1: Check Backend Logs
When you try to add a keyword (e.g., "ganja"), check the backend console for:
- Is the endpoint being hit?
- What error is being thrown?
- Is the userId header present?
- Is the admin role check passing?

### Step 2: Check Browser Console
Open browser DevTools → Console and look for:
```
Sending prohibited keyword payload: {keyword: "ganja", severity: "HIGH", autoAction: "REJECT", category: "drugs"}
```

### Step 3: Check Network Tab
Open browser DevTools → Network tab and:
1. Try to add a keyword
2. Find the POST request to `/admin/prohibited-keywords`
3. Check:
   - **Request Headers**: Is `userId` or `Authorization` present?
   - **Request Payload**: Does it match expected format?
   - **Response**: What error code and message?

---

## Common Issues & Solutions

### Issue 1: 401/403 Unauthorized
**Cause**: Admin not authenticated or userId header missing
**Solution**: 
- Ensure you're logged in as an admin user
- Check AuthInterceptor is adding headers correctly
- Verify backend is reading the correct header name

### Issue 2: 409 Conflict (Duplicate)
**Cause**: Keyword already exists in database
**Solution**: 
- Try a different keyword
- Check database: `SELECT * FROM prohibited_keywords WHERE keyword = 'ganja';`
- Delete existing keyword first

### Issue 3: 400 Bad Request
**Cause**: Missing required fields or invalid values
**Solution**:
- Check payload has keyword, severity, and autoAction
- Verify severity is one of: LOW, MEDIUM, HIGH
- Verify autoAction is one of: WARN, FLAG, REJECT

### Issue 4: 500 Internal Server Error
**Cause**: Backend code exception or database error
**Solution**:
- Check backend logs for stack trace
- Verify database table exists
- Check for constraint violations

---

## Quick Fix for Testing (Temporary)

If you want to test the UI while backend is being implemented, you can temporarily mock the response:

### In admin.service.ts:
```typescript
addProhibitedKeyword(payload: CreateProhibitedKeyword): Observable<ProhibitedKeyword> {
  // TEMPORARY: Mock response for testing UI
  const mockResponse: ProhibitedKeyword = {
    id: Date.now(),
    keyword: payload.keyword!,
    category: payload.category,
    severity: payload.severity || 'MEDIUM',
    autoAction: payload.autoAction || 'FLAG'
  };
  
  // Simulate delay
  return of(mockResponse).pipe(delay(500));
  
  // UNCOMMENT when backend is ready:
  // return this.http.post<ProhibitedKeyword>(`${this.apiUrl}/prohibited-keywords`, normalizedPayload);
}
```

---

## Next Steps

1. **Implement the backend controller** using the code above
2. **Create the database table** if it doesn't exist
3. **Test each endpoint** individually with Postman/curl
4. **Verify admin authorization** is working
5. **Remove frontend mocking** if you added it
6. **Test end-to-end** from the admin UI

---

## Contact Points

- Frontend: Admin Settings Component (`admin-settings.component.ts`)
- Service: `AdminService.addProhibitedKeyword()`
- Backend: `POST /admin/prohibited-keywords`
- Database: `prohibited_keywords` table
