#!/usr/bin/env python
"""
Tenant Isolation Test Runner

This script runs comprehensive tenant isolation tests to verify:
1. Complete data isolation between tenants
2. No cross-tenant data leakage  
3. Proper tenant context validation
4. Security boundaries are maintained
5. Performance with proper indexing
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()

def run_tenant_tests():
    """Run tenant isolation tests"""
    setup_django()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Run tenant isolation tests
    failures = test_runner.run_tests([
        'tests.test_tenant_isolation.TenantIsolationTestCase',
        'tests.test_tenant_isolation.TenantSecurityTestCase', 
        'tests.test_tenant_isolation.TenantPerformanceTestCase',
        'tests.test_tenant_isolation.TenantIntegrationTestCase'
    ])
    
    if failures:
        print(f"\n❌ {failures} test(s) failed!")
        return False
    else:
        print("\n✅ All tenant isolation tests passed!")
        return True

if __name__ == '__main__':
    success = run_tenant_tests()
    sys.exit(0 if success else 1)
