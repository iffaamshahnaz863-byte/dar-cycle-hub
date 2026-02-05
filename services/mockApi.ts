
import { Product, Order, OrderStatus, OrderItem, CartItem } from '../types';
import supabase from './supabaseClient';

// Mapper to convert snake_case from DB to camelCase for the frontend
const productFromDB = (dbProduct: any): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.price,
    imageUrl: dbProduct.image_url,
    stock: dbProduct.stock,
    category: dbProduct.category,
});

const orderFromDB = (dbOrder: any): Order => ({
    id: dbOrder.id,
    userId: dbOrder.user_id,
    userEmail: dbOrder.user_email,
    items: dbOrder.order_items.map((item: any) => ({
        id: item.id,
        product: productFromDB(item.products),
        quantity: item.quantity,
        price: item.price,
    })),
    total: dbOrder.total,
    status: dbOrder.status as OrderStatus,
    createdAt: new Date(dbOrder.created_at),
});

// --- START: Schema-Aware Product Management ---

// Cache for table columns to avoid repeated RPC calls within a session.
let productsTableColumns: string[] | null = null;

/**
 * Fetches the column names for the 'products' table using an RPC call.
 * This is a critical function for making the app resilient to schema changes.
 * NOTE: This requires a corresponding function to be created in your Supabase database.
 *
 * Run the following in your Supabase SQL Editor:
 *
 * create or replace function get_table_columns(p_table_name text)
 * returns setof text as $$
 * begin
 *   return query
 *   select column_name
 *   from information_schema.columns
 *   where table_schema = 'public' and table_name = p_table_name;
 * end;
 * $$ language plpgsql;
 */
const getProductsTableColumns = async (): Promise<string[]> => {
    if (productsTableColumns) {
        return productsTableColumns;
    }

    console.log("Fetching 'products' table schema for the first time...");
    const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: 'products' });

    if (error) {
        console.error("CRITICAL: Could not fetch 'products' table schema via RPC. The app may not save data correctly. Ensure the 'get_table_columns' function exists in your Supabase project.", error);
        // Fallback to a default set of columns to prevent total failure.
        return ['id', 'name', 'description', 'price', 'image_url', 'stock', 'category', 'created_at'];
    }

    console.log("Successfully fetched 'products' table columns:", data);
    productsTableColumns = data as string[];
    return productsTableColumns;
};

// Maps camelCase frontend model properties to snake_case database columns.
const productFieldToColumnMap: { [key: string]: string } = {
    name: 'name',
    description: 'description',
    price: 'price',
    imageUrl: 'image_url',
    stock: 'stock',
    category: 'category',
};

// --- END: Schema-Aware Product Management ---


// Image Upload API
export const uploadProductImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

    return data.publicUrl;
};


// Products API
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(productFromDB);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) {
    // This detailed log is crucial for debugging RLS or missing product issues.
    console.error(`Supabase error fetching product by ID '${id}':`, error.message);
    return undefined;
  };
  return data ? productFromDB(data) : undefined;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("You are not logged in. Please log in to add a product.");
    console.log(`User ${session.user.email} is attempting to add a product.`);

    const availableColumns = await getProductsTableColumns();
    const productPayload: { [key: string]: any } = {};

    for (const key in productData) {
        const columnName = productFieldToColumnMap[key];
        if (columnName && availableColumns.includes(columnName)) {
            productPayload[columnName] = productData[key as keyof typeof productData];
        } else if (columnName) {
            console.warn(`SCHEMA MISMATCH: Column '${columnName}' for field '${key}' not found in 'products' table. Skipping this field.`);
        }
    }
    
    // **THE FIX**: Manually generate and add the UUID on the client-side.
    // This makes the app resilient and ensures a valid ID is always present,
    // regardless of whether the database table has a default value set.
    if (availableColumns.includes('id')) {
        productPayload.id = crypto.randomUUID();
    } else {
        console.warn("SCHEMA MISMATCH: 'id' column not found in 'products' table. Product insertion will likely fail.");
    }

    console.log("Dynamically built, schema-safe product insert payload:", productPayload);

    const { data, error } = await supabase.from('products').insert(productPayload).select().single();

    if (error) {
        console.error("Supabase error while adding product:", error);
        throw error;
    }
    return productFromDB(data);
};

export const updateProduct = async (productData: Product): Promise<Product> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("You are not logged in. Please log in to update a product.");
    console.log(`User ${session.user.email} is attempting to update product #${productData.id}.`);

    const availableColumns = await getProductsTableColumns();
    const productPayload: { [key: string]: any } = {};
    const { id, ...updateData } = productData;

    for (const key in updateData) {
        const columnName = productFieldToColumnMap[key];
        if (columnName && availableColumns.includes(columnName)) {
            productPayload[columnName] = updateData[key as keyof typeof updateData];
        } else if (columnName) {
            console.warn(`SCHEMA MISMATCH: Column '${columnName}' for field '${key}' not found in 'products' table. Skipping this field.`);
        }
    }
    
    console.log(`Dynamically built, schema-safe product update payload for id ${id}:`, productPayload);

    const { data, error } = await supabase.from('products').update(productPayload).eq('id', productData.id).select().single();
    
    if (error) {
        console.error("Supabase error while updating product:", error);
        throw error;
    }
    return productFromDB(data);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
};

// Orders API
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(orderFromDB);
};

export const getAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data.map(orderFromDB);
};

export const createOrder = async (userId: string, userEmail: string, cart: CartItem[]): Promise<Order> => {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      user_email: userEmail,
      total: total,
      status: OrderStatus.Pending,
    })
    .select()
    .single();

  if (orderError) throw orderError;
  
  const newOrderId = orderData.id;

  const orderItemsToInsert = cart.map(item => ({
    order_id: newOrderId,
    product_id: item.product.id,
    quantity: item.quantity,
    price: item.product.price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
  
  if (itemsError) throw itemsError;

  const { data: newOrderData, error: newOrderError } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', newOrderId)
    .single();

  if (newOrderError) throw newOrderError;

  return orderFromDB(newOrderData);
};

export const updateOrderStatus = async (orderId: number, status: OrderStatus): Promise<Order> => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
    if (error) throw error;

    // This won't have the nested items, but it's sufficient for the status update.
    // To return the full order would require another fetch.
    return { ...data, items: [] } as Order; 
};