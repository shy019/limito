import { readSheet, updateSheet, appendToSheet } from './google-sheets';
import { clearCache } from './cache';

interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock?: number;
}

interface Product {
  id: string;
  name: string;
  edition: string;
  type: string;
  description: string;
  descriptionEn: string;
  available: boolean;
  colors: ProductColor[];
  features: string[];
}

export async function getProductsFromSheets(useCache: boolean = true): Promise<SyncResult<Product[]>> {
  try {
    const rows = await readSheet('products', 'A2:I100', useCache);
    
    const products = rows
      .filter((row) => row[0] && row[1])
      .map((row) => {
        let colors: ProductColor[] = [];
        if (row[7]) {
          try {
            const parsed = JSON.parse(String(row[7]));
            colors = Array.isArray(parsed) ? parsed : [];
          } catch {
            colors = [];
          }
        }
        
        return {
          id: String(row[0] || ''),
          name: String(row[1] || ''),
          edition: String(row[2] || '001'),
          type: String(row[3] || 'snapback'),
          description: String(row[4] || ''),
          descriptionEn: String(row[5] || ''),
          available: row[6] === 'TRUE' || row[6] === 'true' || row[6] === true,
          colors,
          features: row[8] ? String(row[8]).split(',').map((f) => f.trim()).filter(f => f) : [],
        };
      });
    
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function addProductToSheets(product: Product): Promise<SyncResult<boolean>> {
  try {
    const colorsArray = Array.isArray(product.colors) ? product.colors : [];
    const featuresArray = Array.isArray(product.features) ? product.features : [];
    
    const values = [[
      product.id,
      product.name,
      product.edition || '001',
      product.type || 'snapback',
      product.description,
      product.descriptionEn,
      product.available ? 'TRUE' : 'FALSE',
      JSON.stringify(colorsArray),
      featuresArray.join(','),
    ]];
    
    await appendToSheet('products', values);
    clearCache('products');
    await getProductsFromSheets(false);
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add product' };
  }
}

export async function updateProductInSheets(product: Partial<Product> & { id: string }): Promise<SyncResult<boolean>> {
  try {
    const rows = await readSheet('products', 'A2:I100', false);
    let rowIndex = -1;
    
    rows.forEach((row, index) => {
      if (row[0] === product.id) {
        rowIndex = index + 2;
      }
    });
    
    if (rowIndex > 0) {
      const colorsArray = Array.isArray(product.colors) ? product.colors : [];
      const featuresArray = Array.isArray(product.features) ? product.features : [];
      
      const values = [[
        product.id,
        product.name || '',
        product.edition || '001',
        product.type || 'snapback',
        product.description || '',
        product.descriptionEn || '',
        product.available ? 'TRUE' : 'FALSE',
        JSON.stringify(colorsArray),
        featuresArray.join(','),
      ]];
      
      await updateSheet('products', `A${rowIndex}:I${rowIndex}`, values);
      clearCache('products');
      await getProductsFromSheets(false);
      return { success: true, data: true };
    }
    
    return { success: false, error: 'Product not found' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update product' };
  }
}

export async function deleteProductFromSheets(productId: string): Promise<SyncResult<boolean>> {
  try {
    const rows = await readSheet('products', 'A2:I100', false);
    const filteredRows = rows.filter((row) => row[0] && row[0] !== productId);
    
    const emptyRows = Array(100).fill([]).map(() => ['', '', '', '', '', '', '', '', '']);
    await updateSheet('products', 'A2:I101', emptyRows);
    
    if (filteredRows.length > 0) {
      await updateSheet('products', `A2:I${filteredRows.length + 1}`, filteredRows);
    }
    
    clearCache('products');
    await getProductsFromSheets(false);
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete product' };
  }
}
