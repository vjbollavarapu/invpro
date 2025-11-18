# Shopify Integration Test Suite

Comprehensive test coverage for the Shopify integration app.

## Test Files

### Core Functionality Tests

1. **test_api_client.py** - API client mocking and error handling
   - ✅ Successful API requests
   - ✅ API error handling
   - ✅ Network error handling
   - ✅ URL building
   - ✅ Missing access token handling

2. **test_upsert.py** - Database upsert operations
   - ✅ Create new records
   - ✅ Update existing records
   - ✅ Tenant ID assignment
   - ✅ Timestamp management

3. **test_hmac_validation.py** - Webhook security
   - ✅ Valid signature validation
   - ✅ Invalid signature rejection
   - ✅ Empty signature handling
   - ✅ Case sensitivity

### Service Tests

4. **test_sync_services.py** - Synchronization services
   - ✅ Product sync success
   - ✅ API error handling
   - ✅ Update existing records
   - ✅ Sync log creation

5. **test_webhook_service.py** - Webhook processing
   - ✅ HMAC verification
   - ✅ Event dispatching
   - ✅ Product/Order/Customer/Inventory webhooks
   - ✅ Sync log creation

### Task Tests

6. **test_sync_tasks.py** - Celery background tasks
   - ✅ Product sync task
   - ✅ Order sync task
   - ✅ Customer sync task
   - ✅ Inventory sync task
   - ✅ Missing integration handling

### API Endpoint Tests

7. **test_endpoints.py** - REST API endpoints
   - ✅ Connect endpoint (create/update)
   - ✅ Disconnect endpoint
   - ✅ Status endpoint
   - ✅ Product listing/retrieval
   - ✅ Order listing/retrieval
   - ✅ Authentication requirements
   - ✅ Tenant isolation

### Model Tests

8. **test_models.py** - Database models and relations
   - ✅ Integration model
   - ✅ Product model
   - ✅ Order model
   - ✅ Customer model
   - ✅ Inventory model
   - ✅ Sync log model
   - ✅ Foreign key relations
   - ✅ Unique constraints
   - ✅ Model methods (mark_error, mark_success)

## Running Tests

### Run all Shopify integration tests:
```bash
cd apps/backend
source venv/bin/activate
pytest shopify_integration/tests/ -v
```

### Run specific test file:
```bash
pytest shopify_integration/tests/test_api_client.py -v
pytest shopify_integration/tests/test_endpoints.py -v
```

### Run by marker:
```bash
pytest shopify_integration/tests/ -m unit -v      # Unit tests only
pytest shopify_integration/tests/ -m api -v      # API tests only
```

### Run with coverage:
```bash
pytest shopify_integration/tests/ --cov=shopify_integration --cov-report=html
```

## Test Coverage

- ✅ API Client: Mocked requests, error handling
- ✅ Upsert Logic: Create/update operations
- ✅ HMAC Validation: Security verification
- ✅ Sync Tasks: Celery task execution
- ✅ Endpoints: REST API functionality
- ✅ Models: Database relations and constraints

## Fixtures

The test suite uses fixtures from `conftest.py` and the main `conftest.py`:
- `tenant1`, `tenant2` - Test tenants
- `user1`, `user2` - Test users
- `authenticated_client1`, `authenticated_client2` - Authenticated API clients
- `shopify_integration` - Shopify integration instance

## Notes

- All tests use pytest markers (`@pytest.mark.unit`, `@pytest.mark.api`)
- Tests mock external dependencies (Shopify API, Celery)
- Multi-tenant isolation is tested
- Error handling is comprehensively covered
