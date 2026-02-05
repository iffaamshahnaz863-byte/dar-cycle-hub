
import { Product, Order, OrderStatus, OrderItem, CartItem, Address } from '../types';
import supabase from './supabaseClient';

/*
--------------------------------------------------------------------------------
-- Supabase Setup for Production-Ready Checkout
--------------------------------------------------------------------------------
-- To enable the new checkout flow, please run the following SQL queries in your
-- Supabase SQL Editor. This sets up the necessary tables and a transactional
-- function to ensure data integrity.

-- 1. Create the 'addresses' table to store customer shipping details.
CREATE TABLE IF NOT EXISTS public.addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    address_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for the new addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 2. Add a foreign key for the address to the 'orders' table.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES public.addresses(id);


-- 3. Create the transactional function to handle the entire checkout process atomically.
-- This function ensures that if any step fails (e.g., out of stock), the entire transaction is rolled back.
CREATE OR REPLACE FUNCTION public.handle_place_order(
    p_user_id uuid,
    p_user_email text,
    p_full_name text,
    p_phone text,
    p_address_line1 text,
    p_address_line2 text,
    p_city text,
    p_state text,
    p_postal_code text,
    p_country text,
    p_address_type text,
    p_cart_items jsonb
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_address_id int;
  new_order_id int;
  total_amount numeric := 0;
  cart_item record;
  product_stock int;
BEGIN
  -- 1. Insert the address and get its ID
  INSERT INTO public.addresses (user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, address_type)
  VALUES (p_user_id, p_full_name, p_phone, p_address_line1, p_address_line2, p_city, p_state, p_postal_code, p_country, p_address_type)
  RETURNING id INTO new_address_id;

  -- 2. Calculate total amount from cart items
  FOR cart_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(product_id uuid, quantity int, price numeric)
  LOOP
    total_amount := total_amount + (cart_item.quantity * cart_item.price);
  END LOOP;

  -- 3. Insert the order and get its ID
  INSERT INTO public.orders (user_id, user_email, total, status, address_id)
  VALUES (p_user_id, p_user_email, total_amount, 'Pending', new_address_id)
  RETURNING id INTO new_order_id;

  -- 4. Insert order items and update product stock
  FOR cart_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(product_id uuid, quantity int, price numeric)
  LOOP
    -- Check for sufficient stock (with locking to prevent race conditions)
    SELECT stock INTO product_stock FROM public.products WHERE id = cart_item.product_id FOR UPDATE;
    IF product_stock < cart_item.quantity THEN
      RAISE EXCEPTION 'Not enough stock for product ID %', cart_item.product_id;
    END IF;

    -- Insert order item
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    VALUES (new_order_id, cart_item.product_id, cart_item.quantity, cart_item.price);

    -- Update product stock
    UPDATE public.products
    SET stock = stock - cart_item.quantity
    WHERE id = cart_item.product_id;
  END LOOP;

  -- 5. Return the new order ID
  RETURN new_order_id;
END;
$$;

*/


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

const getProductsTableColumns = async (): Promise<string[]> => {
    if (productsTableColumns) {
        return productsTableColumns;
    }

    console.log("Fetching 'products' table schema for the first time...");
    const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: 'products' });

    if (error) {
        console.error("CRITICAL: Could not fetch 'products' table schema via RPC. The app may not save data correctly. Ensure the 'get_table_columns' function exists in your Supabase project.", error);
        return ['id', 'name', 'description', 'price', 'image_url', 'stock', 'category', 'created_at'];
    }

    console.log("Successfully fetched 'products' table columns:", data);
    productsTableColumns = data as string[];
    return productsTableColumns;
};

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
export const getProducts = async ({ signal }: { signal?: AbortSignal } = {}): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*', { signal }).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(productFromDB);
};

export const getProductById = async (id: string, { signal }: { signal?: AbortSignal } = {}): Promise<Product | undefined> => {
  const { data, error } = await supabase.from('products').select('*', { signal }).eq('id', id).single();
  if (error) {
    if (error.name !== 'AbortError') {
      console.error(`Supabase error fetching product by ID '${id}':`, error.message);
    }
    // Re-throw the error to be handled by the caller
    throw error;
  };
  return data ? productFromDB(data) : undefined;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("You are not logged in. Please log in to add a product.");

    const availableColumns = await getProductsTableColumns();
    const productPayload: { [key: string]: any } = {};

    for (const key in productData) {
        const columnName = productFieldToColumnMap[key];
        if (columnName && availableColumns.includes(columnName)) {
            productPayload[columnName] = productData[key as keyof typeof productData];
        }
    }
    
    if (availableColumns.includes('id')) {
        productPayload.id = crypto.randomUUID();
    }

    const { data, error } = await supabase.from('products').insert(productPayload).select().single();

    if (error) {
        console.error("Supabase error while adding product:", error);
        throw error;
    }
    return productFromDB(data);
};

export const updateProduct = async (productData: Product): Promise<Product> => {
    const { id, ...updateData } = productData;
    const { data, error } = await supabase.from('products').update({
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        image_url: updateData.imageUrl,
        stock: updateData.stock,
        category: updateData.category,
    }).eq('id', id).select().single();
    
    if (error) throw error;
    return productFromDB(data);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
};

// Orders API
export const getUserOrders = async (userId: string, { signal }: { signal?: AbortSignal } = {}): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))', { signal })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(orderFromDB);
};

export const getAllOrders = async ({ signal }: { signal?: AbortSignal } = {}): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))', { signal })
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data.map(orderFromDB);
};

/**
 * Places a new order by calling the transactional database function.
 * This is the primary function for the checkout process.
 *
 * @param userId The ID of the user placing the order.
 * @param userEmail The email of the user.
 * @param address The complete shipping address.
 * @param cart The user's shopping cart.
 * @returns The new order ID.
 */
export const placeOrderWithDetails = async (userId: string, userEmail: string, address: Address, cart: CartItem[]): Promise<number> => {
    const cartItemsPayload = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
    }));

    const { data, error } = await supabase.rpc('handle_place_order', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_full_name: address.fullName,
        p_phone: address.phone,
        p_address_line1: address.addressLine1,
        p_address_line2: address.addressLine2,
        p_city: address.city,
        p_state: address.state,
        p_postal_code: address.postalCode,
        p_country: address.country,
        p_address_type: address.addressType,
        p_cart_items: cartItemsPayload
    });

    if (error) {
        console.error('Supabase RPC error placing order:', error);
        throw new Error(`Could not place order. ${error.message}`);
    }

    return data;
};


export const updateOrderStatus = async (orderId: number, status: OrderStatus): Promise<Order> => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
    if (error) throw error;

    return { ...data, items: [] } as Order; 
};