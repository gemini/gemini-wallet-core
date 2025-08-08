import { errorCodes, providerErrors, rpcErrors, serializeError } from "@metamask/rpc-errors";
import {
  type Address,
  type Hex,
  type SignMessageParameters,
  SignTypedDataParameters,
  type SwitchChainParameters,
  type TransactionRequest,
} from "viem";

import { convertSendValuesToBigInt, fetchRpcRequest, validateRpcRequestArgs } from "./provider.utils";
import { GeminiStorage, STORAGE_ETH_ACCOUNTS_KEY, STORAGE_ETH_ACTIVE_CHAIN_KEY } from "@/storage";
import { type GeminiProviderConfig, ProviderEventEmitter, type ProviderInterface, type RpcRequestArgs } from "@/types";
import { hexStringFromNumber } from "@/utils";
import { GeminiWallet } from "@/wallets";
import { DEFAULT_CHAIN_ID } from "@/constants";

export class GeminiWalletProvider extends ProviderEventEmitter implements ProviderInterface {
  private readonly config: GeminiProviderConfig;
  private wallet: GeminiWallet | null = null;

  constructor(providerConfig: Readonly<GeminiProviderConfig>) {
    super();
    this.config = providerConfig;
    this.wallet = new GeminiWallet({
      ...providerConfig,
      onDisconnectCallback: this.disconnect.bind(this),
    });
  }

  public async request<T>(args: RpcRequestArgs): Promise<T> {
    try {
      validateRpcRequestArgs(args);

      if (!this.wallet?.accounts?.length) {
        switch (args.method) {
          case "eth_requestAccounts": {
            this.wallet = new GeminiWallet({
              ...this.config,
              onDisconnectCallback: this.disconnect.bind(this),
            });
            await this.wallet.connect();
            this.emit("accountsChanged", this.wallet.accounts);
            break;
          }
          case "net_version":
            // not connected default value
            return DEFAULT_CHAIN_ID as T;
          case "eth_chainId":
            // not connected default value
            return hexStringFromNumber(DEFAULT_CHAIN_ID) as T;
          default: {
            // all other methods require active connection
            throw providerErrors.unauthorized();
          }
        }
      }

      let response;
      let requestParams;
      switch (args.method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          response = this.wallet.accounts;
          break;
        case "net_version":
          response = this.wallet.chain.id;
          break;
        case "eth_chainId":
          response = hexStringFromNumber(this.wallet.chain.id);
          break;
        case "personal_sign":
        case "wallet_sign":
          requestParams = args.params as Array<Hex | Address>;
          response = await this.wallet.signData({
            account: requestParams[1] as Address,
            message: requestParams[0] as Hex,
          } as SignMessageParameters);
          if (response.error) {
            throw rpcErrors.transactionRejected(response.error);
          } else {
            response = response.hash;
          }
          break;
        case "eth_sendTransaction":
        case "wallet_sendTransaction":
          requestParams = args.params as Array<TransactionRequest>;
          requestParams = convertSendValuesToBigInt(requestParams[0]);
          response = await this.wallet.sendTransaction(requestParams);
          if (response.error) {
            throw rpcErrors.transactionRejected(response.error);
          } else {
            response = response.hash;
          }
          break;
        case "wallet_switchEthereumChain":
          requestParams = args.params as SwitchChainParameters;
          if (!requestParams?.id || !Number.isInteger(requestParams?.id)) {
            throw rpcErrors.invalidParams("Invalid chain id argument. Must be valid chainId number.");
          }
          response = await this.wallet.switchChain(requestParams);

          // per EIP-3326, a non-null response indicates error
          if (response) {
            throw providerErrors.custom({ code: 4902, message: response });
          }

          await this.emit("chainChanged", hexStringFromNumber(requestParams?.id));
          break;
        case "eth_signTypedData_v1":
        case "eth_signTypedData_v2":
        case "eth_signTypedData_v3":
        case "eth_signTypedData_v4":
        case "eth_signTypedData": {
          requestParams = args.params as Array<Hex | Address>;
          const signedTypedDataParams = JSON.parse(requestParams[1] as string) as SignTypedDataParameters;
          response = await this.wallet.signTypedData({
            account: requestParams[0] as Address,
            domain: signedTypedDataParams.domain,
            message: signedTypedDataParams.message,
            primaryType: signedTypedDataParams.primaryType,
            types: signedTypedDataParams.types,
          });
          if (response.error) {
            throw rpcErrors.transactionRejected(response.error);
          } else {
            response = response.hash;
          }
          break;
        }
        // TODO: not yet implemented or unclear if we support
        case "eth_ecRecover":
        case "eth_subscribe":
        case "eth_unsubscribe":
        case "personal_ecRecover":
        case "eth_signTransaction":
        case "wallet_watchAsset":
        case "wallet_sendCalls":
        case "wallet_getCallsStatus":
        case "wallet_getCapabilities":
        case "wallet_showCallsStatus":
        case "wallet_grantPermissions":
          throw rpcErrors.methodNotSupported("Not yet implemented.");

        // not supported
        case "eth_sign":
        case "eth_coinbase":
        case "wallet_addEthereumChain":
          throw rpcErrors.methodNotSupported();

        // call rpc directly for everything else
        default:
          if (!this.wallet.chain.rpcUrl)
            throw rpcErrors.internal(`RPC URL missing for current chain (${this.wallet.chain.id})`);
          return fetchRpcRequest(args, this.wallet.chain.rpcUrl);
      }

      return response as T;
    } catch (error) {
      const { code } = error as { code?: number };
      if (code === errorCodes.provider.unauthorized) this.disconnect();
      return Promise.reject(serializeError(error));
    }
  }

  // custom wallet function to open settings page
  async openSettings() {
    await this.wallet?.openSettings();
  }

  async disconnect() {
    this.wallet = null;
    const Storage = new GeminiStorage();
    await Storage.removeItem(STORAGE_ETH_ACCOUNTS_KEY);
    await Storage.removeItem(STORAGE_ETH_ACTIVE_CHAIN_KEY);
    await this.emit("disconnect", "User initiated disconnection");
  }
}
