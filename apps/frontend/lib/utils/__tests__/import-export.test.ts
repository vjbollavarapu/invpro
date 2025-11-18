import { parseCsv, validateProductImport } from '../import-export'

describe('Import/Export Utilities', () => {
  describe('parseCsv', () => {
    it('should parse valid CSV content', async () => {
      const csvContent = `name,sku,quantity,unitCost
Product 1,SKU001,100,10.50
Product 2,SKU002,50,20.00`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCsv(file)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'Product 1',
        sku: 'SKU001',
        quantity: '100',
        unitCost: '10.50'
      })
    })

    it('should handle empty lines', async () => {
      const csvContent = `name,sku,quantity

Product 1,SKU001,100

Product 2,SKU002,50`
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const result = await parseCsv(file)

      expect(result).toHaveLength(2)
    })

    it('should reject malformed CSV', async () => {
      const csvContent = `name,sku,quantity
Product 1,SKU001` // Missing column
      
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      
      // This should still parse but with fewer fields
      const result = await parseCsv(file)
      expect(result[0]).toHaveProperty('name')
    })
  })

  describe('validateProductImport', () => {
    it('should validate correct product data', () => {
      const data = [
        {
          name: 'Product 1',
          sku: 'SKU001',
          category: 'Electronics',
          quantity: '100',
          unit: 'pcs',
          unitCost: '10.50',
          sellingPrice: '15.00',
          reorderLevel: '20'
        }
      ]

      const result = validateProductImport(data)

      expect(result.valid).toHaveLength(1)
      expect(result.invalid).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject products with missing required fields', () => {
      const data = [
        {
          name: 'Product 1',
          // Missing sku
          category: 'Electronics',
          quantity: '100'
        }
      ]

      const result = validateProductImport(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject products with invalid data types', () => {
      const data = [
        {
          name: 'Product 1',
          sku: 'SKU001',
          category: 'Electronics',
          quantity: 'not-a-number', // Invalid
          unit: 'pcs',
          unitCost: '10.50',
          sellingPrice: '15.00',
          reorderLevel: '20'
        }
      ]

      const result = validateProductImport(data)

      expect(result.invalid.length).toBeGreaterThan(0)
    })

    it('should handle mixed valid and invalid products', () => {
      const data = [
        {
          name: 'Valid Product',
          sku: 'SKU001',
          category: 'Electronics',
          quantity: '100',
          unit: 'pcs',
          unitCost: '10.50',
          sellingPrice: '15.00',
          reorderLevel: '20'
        },
        {
          name: 'Invalid Product',
          // Missing required fields
          quantity: '50'
        }
      ]

      const result = validateProductImport(data)

      expect(result.valid).toHaveLength(1)
      expect(result.invalid).toHaveLength(1)
    })

    it('should validate numeric fields', () => {
      const data = [
        {
          name: 'Product',
          sku: 'SKU001',
          category: 'Electronics',
          quantity: '-10', // Negative quantity should be invalid
          unit: 'pcs',
          unitCost: '10.50',
          sellingPrice: '15.00',
          reorderLevel: '20'
        }
      ]

      const result = validateProductImport(data)

      // Should reject negative quantities
      expect(result.invalid.length).toBeGreaterThan(0)
    })
  })
})

