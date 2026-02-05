
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

export const getProductById = async (id: number): Promise<Product | undefined> => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) {
    console.error(error);
    return undefined;
  };
  return data ? productFromDB(data) : undefined;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    // For debugging RLS issues, let's check the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw new Error("Could not verify user session. Please log in again.");
    }
    if (!session) {
        throw new Error("You are not logged in. Please log in to add a product.");
    }
    console.log(`User ${session.user.email} (ID: ${session.user.id}) is attempting to add a product.`);

    const { data, error } = await supabase.from('products').insert({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image_url: productData.imageUrl,
        stock: productData.stock,
        category: productData.category,
    }).select().single();

    if (error) {
        console.error("Supabase error while adding product:", error);
        throw error;
    }
    return productFromDB(data);
};

export const updateProduct = async (productData: Product): Promise<Product> => {
    // For debugging RLS issues, let's check the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw new Error("Could not verify user session. Please log in again.");
    }
    if (!session) {
        throw new Error("You are not logged in. Please log in to update a product.");
    }
    console.log(`User ${session.user.email} (ID: ${session.user.id}) is attempting to update product #${productData.id}.`);

    const { data, error } = await supabase.from('products').update({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        image_url: productData.imageUrl,
        stock: productData.stock,
        category: productData.category,
    }).eq('id', productData.id).select().single();
    
    if (error) {
        console.error("Supabase error while updating product:", error);
        throw error;
    }
    return productFromDB(data);
};

export const deleteProduct = async (productId: number): Promise<void> => {
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
