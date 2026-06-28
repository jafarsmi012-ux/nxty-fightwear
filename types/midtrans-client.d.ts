declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionResponse {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<TransactionResponse>;
    createTransactionToken(parameter: Record<string, unknown>): Promise<string>;
    createTransactionRedirectUrl(parameter: Record<string, unknown>): Promise<string>;
  }

  export { Snap };
  export default { Snap };
}
