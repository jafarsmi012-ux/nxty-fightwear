import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import midtransClient from "midtrans-client";
import productsData from "@/data/products.json";
import type { CartItem, Customer, Product } from "@/types";

interface RequestBody {
  customer: Customer;
  items: CartItem[];
}

function getProductById(id: string): Product | undefined {
  return productsData.products.find((p) => p.id === id);
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validation
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Cart tidak boleh kosong" },
        { status: 400 }
      );
    }

    const customer = body.customer;
    if (
      !customer?.name?.trim() ||
      !customer?.email?.trim() ||
      !customer?.phone?.trim() ||
      !customer?.address?.trim() ||
      !customer?.city?.trim()
    ) {
      return NextResponse.json(
        { error: "Data customer tidak lengkap" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Recalculate prices server-side from products.json (never trust frontend price)
    const itemDetails: {
      id: string;
      price: number;
      quantity: number;
      name: string;
    }[] = [];
    let grossAmount = 0;

    for (const cartItem of body.items) {
      const product = getProductById(cartItem.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produk tidak ditemukan: ${cartItem.productId}` },
          { status: 400 }
        );
      }
      const price = product.price;
      const quantity = Math.max(1, Math.floor(cartItem.quantity || 1));
      const lineTotal = price * quantity;
      grossAmount += lineTotal;

      itemDetails.push({
        id: cartItem.productId,
        price,
        quantity,
        name: `${product.name} (${cartItem.size}, ${cartItem.color})`,
      });
    }

    // Unique order ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const orderId = `NXTY-${timestamp}-${random}`;

    // Midtrans config
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key tidak dikonfigurasi" },
        { status: 500 }
      );
    }

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: serverKey,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: customer.name.split(" ")[0],
        last_name: customer.name.split(" ").slice(1).join(" ") || undefined,
        email: customer.email,
        phone: customer.phone,
        billing_address: {
          first_name: customer.name.split(" ")[0],
          last_name: customer.name.split(" ").slice(1).join(" ") || undefined,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          country_code: "IDN",
        },
        shipping_address: {
          first_name: customer.name.split(" ")[0],
          last_name: customer.name.split(" ").slice(1).join(" ") || undefined,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          country_code: "IDN",
        },
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId,
    });
  } catch (error) {
    console.error("Midtrans error:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi. Coba lagi." },
      { status: 500 }
    );
  }
}
