# End-to-End Test Scenarios

**Purpose:** Manual testing scenarios to verify the complete system works

---

## 🧪 E2E Test Scenarios

### Scenario 1: New User Onboarding ✅

**Steps:**
1. Open `http://localhost:3000`
2. Click "Register" or navigate to `/register`
3. Fill in registration form:
   - Name: Test User
   - Email: testuser@example.com
   - Password: TestPass123
4. Click "Register"
5. Should redirect to dashboard or login
6. Login with credentials
7. Should see dashboard

**Expected Results:**
- ✅ User created in backend
- ✅ JWT tokens received
- ✅ Tenant auto-assigned or user selects tenant
- ✅ Dashboard loads with metrics

---

### Scenario 2: Product Management ✅

**Pre-requisite:** Logged in user

**Steps:**
1. Navigate to "Inventory" page
2. Click "Add Product"
3. Fill in product details:
   - Name: Test Product
   - SKU: TEST-001
   - Category: Equipment
   - Quantity: 100
   - Unit: pcs
   - Unit Cost: $50.00
4. Click "Add Product"
5. Product should appear in list with auto-generated code (PRD-001)
6. Click edit on product
7. Change quantity to 150
8. Save changes
9. Click "Adjust Stock"
10. Add 50 units
11. Verify quantity updated

**Expected Results:**
- ✅ Product created with auto-code
- ✅ Appears in product list
- ✅ Can edit product
- ✅ Stock adjustment works
- ✅ Total value calculated correctly

---

### Scenario 3: Order Creation ✅

**Pre-requisite:** Products exist

**Steps:**
1. Navigate to "Sales" page
2. Click "Create Order"
3. Select customer (or create new)
4. Add products to order:
   - Product 1: Quantity 5
   - Product 2: Quantity 3
5. Review order total
6. Click "Create Order"
7. Order should appear with auto-code (ORD-001 or ORD-2024-001)
8. Click on order to view details
9. Click "Fulfill Order"
10. Status should change to "Delivered"

**Expected Results:**
- ✅ Order created with auto-code
- ✅ Line items calculated correctly
- ✅ Total amount correct
- ✅ Order appears in list
- ✅ Status updates work

---

### Scenario 4: Multi-Tenant Switching ✅

**Pre-requisite:** User belongs to multiple tenants

**Steps:**
1. Login as multi-tenant user
2. Note current tenant in header/dropdown
3. View product list (note products shown)
4. Click tenant switcher dropdown
5. Select different tenant
6. Confirm switch
7. Product list should reload with new tenant's products
8. Create a product
9. Switch back to first tenant
10. New product should NOT appear (different tenant)

**Expected Results:**
- ✅ Tenant switcher shows all user's tenants
- ✅ Data changes when tenant switches
- ✅ Products isolated by tenant
- ✅ Auto-numbers independent per tenant

---

### Scenario 5: Dashboard Analytics ✅

**Pre-requisite:** Some data exists

**Steps:**
1. Navigate to Dashboard
2. Verify metrics displayed:
   - Total Stock Value
   - Active Warehouses  
   - Pending Orders
   - Low Stock Items
3. Navigate to Inventory Dashboard
4. Verify inventory-specific metrics
5. Navigate to Sales Dashboard
6. Verify sales metrics and charts
7. Check that all data matches current tenant

**Expected Results:**
- ✅ Dashboard loads with real data
- ✅ Metrics calculated correctly
- ✅ Charts display data
- ✅ All data is tenant-scoped

---

### Scenario 6: Procurement Workflow ✅

**Steps:**
1. Navigate to Procurement
2. Click "Suppliers" tab
3. Add new supplier
4. Navigate to "Purchase Requests" tab
5. Create purchase request for a product
6. Status should be "Pending"
7. Click "Approve" (if admin)
8. Status changes to "Approved"
9. Navigate to "Purchase Orders" tab
10. Create PO for approved request
11. PO should have auto-code (PO-001 or PO-2024-001)

**Expected Results:**
- ✅ Supplier created with auto-code
- ✅ Purchase request workflow works
- ✅ Approval process functions
- ✅ PO created with auto-code

---

### Scenario 7: Warehouse Management ✅

**Steps:**
1. Navigate to Warehouses
2. View list of warehouses
3. Each should show:
   - Warehouse code (WH-001)
   - Capacity percentage
   - Active clients
   - Total SKUs
4. Click "New Transfer"
5. Select source and destination warehouses
6. Select product and quantity
7. Create transfer
8. Transfer should appear with code (TRF-001)

**Expected Results:**
- ✅ Warehouses display with metrics
- ✅ Capacity calculated correctly
- ✅ Transfer created
- ✅ Transfer has auto-code

---

### Scenario 8: Financial Tracking ✅

**Steps:**
1. Navigate to Finance
2. View Cost Centers tab
3. See budget vs actual for each center
4. Navigate to Expenses tab
5. Add new expense
6. Link to an order or PO (optional)
7. Expense should appear in list
8. View expense breakdown by category
9. View summary statistics

**Expected Results:**
- ✅ Cost centers display variance
- ✅ Expenses tracked correctly
- ✅ Linking to orders/POs works
- ✅ Category breakdown accurate

---

## 🔍 Integration Points to Verify

### Frontend → Backend
- ✅ Login sends credentials to backend
- ✅ Backend returns JWT tokens
- ✅ Token stored in localStorage
- ✅ Tenant ID stored in localStorage

### API Requests
- ✅ Authorization header included
- ✅ X-Tenant-ID header included
- ✅ Requests reach backend
- ✅ Responses return correctly

### Data Flow
- ✅ Form submissions create backend records
- ✅ Lists display backend data
- ✅ Updates reflect immediately
- ✅ Deletions work correctly

### Multi-Tenancy
- ✅ Data filtered by tenant
- ✅ Auto-numbers unique per tenant
- ✅ Tenant switching changes data view
- ✅ No cross-tenant data leakage

---

## 🐛 Common Issues & Solutions

### Issue: Login doesn't work
**Check:**
- Backend running on port 8000?
- Test user created in backend?
- Network tab shows 401/400 error?

**Solution:**
```bash
cd apps/backend
python manage.py shell
# Create test user (see commands in report)
```

### Issue: Data not loading
**Check:**
- Token in localStorage?
- Tenant ID in localStorage?
- Network tab shows requests?

**Solution:**
- Clear localStorage
- Login again
- Check browser console for errors

### Issue: 404 on API calls
**Check:**
- Backend URL correct? (localhost:8000)
- Frontend API routes exist?
- Backend server running?

**Solution:**
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check backend server is running
- Check backend URL patterns

---

## ✅ Pre-Launch Checklist

### Backend
- [x] PostgreSQL running
- [x] All migrations applied
- [x] Test user created
- [x] Backend server running on 8000
- [x] No errors in terminal

### Frontend  
- [ ] Frontend server running on 3000
- [ ] Can access http://localhost:3000
- [ ] No console errors
- [ ] API routes responding

### Integration
- [ ] Login works
- [ ] Dashboard loads with data
- [ ] Can create products
- [ ] Can create orders
- [ ] Tenant switching works (if applicable)

---

## 🎯 Quick Smoke Test

**5-Minute Smoke Test:**

1. ✅ Start backend
2. ✅ Start frontend
3. ✅ Open browser to localhost:3000
4. ✅ Register or login
5. ✅ View dashboard (should show metrics)
6. ✅ Go to Inventory, verify products load
7. ✅ Create a test product
8. ✅ Go to Sales, create a test order
9. ✅ Verify order appears
10. ✅ Check all pages load

**If all 10 steps work:** ✅ System is operational!

---

## 📝 Test Report Template

Use this when testing:

```
Test Date: ___________
Tester: ___________
Environment: Development

Scenario 1 - User Onboarding:     [ ] Pass [ ] Fail
Scenario 2 - Product Management:  [ ] Pass [ ] Fail
Scenario 3 - Order Creation:      [ ] Pass [ ] Fail
Scenario 4 - Multi-Tenant:        [ ] Pass [ ] Fail
Scenario 5 - Dashboard:           [ ] Pass [ ] Fail
Scenario 6 - Procurement:         [ ] Pass [ ] Fail
Scenario 7 - Warehouse:           [ ] Pass [ ] Fail
Scenario 8 - Financial:           [ ] Pass [ ] Fail

Overall Result: ___________
Issues Found: ___________
Notes: ___________
```

---

*Test Scenarios Created: October 13, 2025*  
*Ready for Manual/Automated Testing*

