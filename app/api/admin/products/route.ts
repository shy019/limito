import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/lib/products';
import { revalidatePath } from 'next/cache';
import { updateProductInSheets, deleteProductFromSheets, addProductToSheets } from '@/lib/sheets-products';
import { autoTranslate } from '@/lib/auto-translate';
import { deleteProductImages } from '@/lib/image-processor';

export async function POST(request: NextRequest) {
  try {
    const newProduct: Product = await request.json();
    
    if (!newProduct.descriptionEn) {
      newProduct.descriptionEn = newProduct.description;
    }
    
    const keysToTranslate: string[] = [];
    newProduct.colors.forEach(color => keysToTranslate.push(color.name));
    newProduct.features.forEach(feature => keysToTranslate.push(feature));
    autoTranslate(keysToTranslate);
    
    const result = await addProductToSheets(newProduct);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    revalidatePath('/api/products', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    
    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedProduct: Product = await request.json();
    
    if (!updatedProduct.descriptionEn) {
      updatedProduct.descriptionEn = updatedProduct.description;
    }
    
    const keysToTranslate: string[] = [];
    updatedProduct.colors.forEach(color => keysToTranslate.push(color.name));
    updatedProduct.features.forEach(feature => keysToTranslate.push(feature));
    autoTranslate(keysToTranslate);
    
    const result = await updateProductInSheets(updatedProduct);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    revalidatePath('/api/products', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await deleteProductImages(id);
    const result = await deleteProductFromSheets(id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    revalidatePath('/api/products', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
