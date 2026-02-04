import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

import type { Product } from '@/lib/products';
import { revalidatePath } from 'next/cache';
import { updateProductInSheets, deleteProductFromSheets, addProductToSheets } from '@/lib/turso-products-v2';

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`api-${ip}`, 20, 60000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const newProduct: Product = await request.json();
    
    if (!newProduct.descriptionEn) {
      newProduct.descriptionEn = newProduct.description;
    }
    
    const result = await addProductToSheets(newProduct);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    revalidatePath('/api/products', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    
    return NextResponse.json({ success: true, product: newProduct });
  } catch {
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedProduct: Product = await request.json();
    
    if (!updatedProduct.descriptionEn) {
      updatedProduct.descriptionEn = updatedProduct.description;
    }
    
    const result = await updateProductInSheets(updatedProduct);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    revalidatePath('/api/products', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    const result = await deleteProductFromSheets(id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    revalidatePath('/api/products', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
