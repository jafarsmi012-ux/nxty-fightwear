/**
 * Everpro Shipping API client.
 *
 * Docs: https://developer.everpro.id/
 *
 * Endpoint yang dipakai mengikuti dokumentasi publik Everpro Shipping v1.
 * Catatan: dokumentasi Everpro dapat berubah — bila response shape berbeda,
 * sesuaikan parser di bawah atau override via wrapper function.
 *
 * Behaviour kalau EVERPRO_API_KEY kosong:
 *   - getRates() → return mock 3 rate (JNE REG, JNT EZ, SiCepat BEST)
 *   - createShipment() → throw Error dengan pesan jelas
 *   - trackShipment() → return mock timeline
 *   - console.warn sekali per proses.
 */

const EVERPRO_API_KEY = process.env.EVERPRO_API_KEY || "";
const EVERPRO_BASE_URL = process.env.EVERPRO_BASE_URL || "https://api.everpro.id";

const DEFAULT_TIMEOUT_MS = 15_000;

let warnedMissingKey = false;
function warnMissingKey(): void {
  if (warnedMissingKey) return;
  warnedMissingKey = true;
  console.warn(
    "[everpro] EVERPRO_API_KEY kosong — menggunakan mock data untuk development. Set EVERPRO_API_KEY untuk integrasi nyata.",
  );
}

export interface RateRequest {
  /** Origin city ID atau postal code */
  origin: string;
  /** Destination city ID atau postal code */
  destination: string;
  /** Berat dalam gram */
  weight: number;
  /** Filter courier: "jne", "jnt", "sicepat", dst */
  courier?: string;
}

export interface Rate {
  courier: string;
  service: string;
  cost: number;
  /** Estimasi durasi, mis. "2-3" hari */
  etd: string;
}

export interface ShipmentRequest {
  order_id: string;
  origin: string;
  destination: string;
  weight: number;
  courier: string;
  service: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_postal_code: string;
  item_name: string;
  item_value: number;
  item_weight: number;
  item_qty: number;
}

export interface ShipmentResult {
  waybill: string;
  courier: string;
  service: string;
  etd: string;
}

export interface TrackingEvent {
  /** ISO date string */
  date: string;
  description: string;
  location?: string;
}

export interface TrackingResult {
  status: string;
  courier: string;
  waybill: string;
  events: TrackingEvent[];
}

export class EverproError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "EverproError";
    this.status = status;
  }
}

async function everproFetch<T>(
  path: string,
  init: RequestInit & { method?: string },
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${EVERPRO_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${EVERPRO_API_KEY}`,
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new EverproError("Everpro API timeout", 504);
    }
    throw new EverproError(
      `Everpro API network error: ${err instanceof Error ? err.message : "unknown"}`,
      502,
    );
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new EverproError(
      `Everpro API ${res.status}: ${detail || res.statusText}`,
      res.status,
    );
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new EverproError("Everpro API returned invalid JSON", 502);
  }
}

/**
 * Cek ongkir dari Everpro.
 *
 * Endpoint: POST /shipment/v1/rates
 * Body: { origin, destination, weight, courier? }
 */
export async function getRates(req: RateRequest): Promise<Rate[]> {
  if (!EVERPRO_API_KEY) {
    warnMissingKey();
    return mockRates(req);
  }

  const res = await everproFetch<{ data?: Rate[] } | Rate[]>("/shipment/v1/rates", {
    method: "POST",
    body: JSON.stringify({
      origin: req.origin,
      destination: req.destination,
      weight: req.weight,
      courier: req.courier,
    }),
  });

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

/**
 * Buat shipment + generate AWB (resi) di Everpro.
 *
 * Endpoint: POST /shipment/v1/orders
 * Response Everpro biasanya berisi { data: { airway_bill_no, courier, service, etd } }
 * atau { airway_bill_no, ... }. Parser mengikuti kedua kemungkinan.
 */
export async function createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
  if (!EVERPRO_API_KEY) {
    warnMissingKey();
    // Untuk dev tanpa API key, generate waybill dummy deterministik
    // supaya test flow admin tidak stuck.
    const stamp = Date.now().toString().slice(-8);
    return {
      waybill: `MOCK${stamp}`,
      courier: req.courier,
      service: req.service,
      etd: "2-3",
    };
  }

  // Response Everpro bisa berupa object langsung ATAU wrapper { data: {...} }.
  // Pakai union + narrowing eksplisit agar TypeScript happy.
  type ShipmentInner = Partial<ShipmentResult> & { airway_bill_no?: string };
  type ShipmentResponse = { data?: ShipmentInner } | ShipmentInner;

  const res = await everproFetch<ShipmentResponse>("/shipment/v1/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: req.order_id,
      origin: req.origin,
      destination: req.destination,
      weight: req.weight,
      courier: req.courier,
      service: req.service,
      recipient: {
        name: req.recipient_name,
        phone: req.recipient_phone,
        address: req.recipient_address,
        postal_code: req.recipient_postal_code,
      },
      items: [
        {
          name: req.item_name,
          value: req.item_value,
          weight: req.item_weight,
          qty: req.item_qty,
        },
      ],
    }),
  });

  // Normalisasi ke inner shape. Type assertion di sini aman karena:
  //   - Kalau `res` adalah wrapper, `res.data` adalah ShipmentInner
  //   - Kalau `res` adalah langsung, `res` adalah ShipmentInner
  const inner = ("data" in res && res.data ? res.data : res) as ShipmentInner;
  const waybill = inner.waybill ?? inner.airway_bill_no;
  if (!waybill) {
    throw new EverproError(
      "Everpro createShipment: tidak ada waybill di response",
      502,
    );
  }

  return {
    waybill,
    courier: inner.courier ?? req.courier,
    service: inner.service ?? req.service,
    etd: inner.etd ?? "",
  };
}

/**
 * Lacak paket berdasarkan nomor resi + courier.
 *
 * Endpoint: GET /shipment/v1/track?awb=XXX&courier=YYY
 * (Everpro juga support POST dengan body JSON — kita coba GET dulu,
 *  parser response robust terhadap kedua bentuk.)
 */
export async function trackShipment(
  waybill: string,
  courier: string,
): Promise<TrackingResult> {
  if (!EVERPRO_API_KEY) {
    warnMissingKey();
    return mockTracking(waybill, courier);
  }

  const qs = new URLSearchParams({ awb: waybill, courier });
  // Sama seperti createShipment: response bisa langsung atau dibungkus {data}.
  type TrackingInner = {
    status?: string;
    courier?: string;
    waybill?: string;
    events?: TrackingEvent[];
    manifest?: TrackingEvent[];
    history?: TrackingEvent[];
  };
  type TrackingResponse = { data?: TrackingInner } | TrackingInner;

  const res = await everproFetch<TrackingResponse>(
    `/shipment/v1/track?${qs.toString()}`,
    {
      method: "GET",
    },
  );

  const inner = ("data" in res && res.data ? res.data : res) as TrackingInner;
  const events: TrackingEvent[] =
    inner.events ?? inner.manifest ?? inner.history ?? [];

  return {
    status: inner.status ?? "unknown",
    courier,
    waybill,
    events,
  };
}

/* ------------------------------------------------------------------ */
/* Mock data (untuk development tanpa EVERPRO_API_KEY)                */
/* ------------------------------------------------------------------ */

function mockRates(req: RateRequest): Rate[] {
  const base = Math.max(9000, Math.round(req.weight * 80));
  return [
    { courier: "jne", service: "REG", cost: base, etd: "2-3" },
    { courier: "jnt", service: "EZ", cost: Math.round(base * 0.85), etd: "2-4" },
    { courier: "sicepat", service: "BEST", cost: Math.round(base * 0.9), etd: "1-2" },
  ];
}

function mockTracking(waybill: string, courier: string): TrackingResult {
  const now = new Date();
  const minus = (h: number) =>
    new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  return {
    status: "in_transit",
    courier,
    waybill,
    events: [
      {
        date: minus(2),
        description: "Paket diterima di hub asal",
        location: "Bandung",
      },
      {
        date: minus(18),
        description: "Paket telah diserahterimakan ke kurir",
        location: "Bandung",
      },
      {
        date: minus(26),
        description: "Paket sedang diproses di gudang",
        location: "Bandung",
      },
    ],
  };
}
