# @gemini-wallet/core

Core SDK for integrating with Gemini Wallet through secure popup-based communication.

## Overview

`@gemini-wallet/core` provides the fundamental communication layer for interacting with Gemini Wallet. It handles secure cross-origin communication via the postMessage API, managing popup windows for user authentication and transaction approvals.

## Features

- 🔒 **Secure Communication**: PostMessage-based cross-origin communication
- 🪟 **Popup Management**: Automatic popup window lifecycle management
- 🔄 **Event-Driven**: Promise-based request/response pattern
- 🌐 **Cross-Browser**: Works across all modern browsers
- ⚡ **Lightweight**: Minimal dependencies for optimal bundle size

## Installation

```bash
npm install @gemini-wallet/core
# or
yarn add @gemini-wallet/core
# or
pnpm add @gemini-wallet/core
```

## Usage

### Basic Example

```typescript
import { Communicator, GeminiSdkEvent } from '@gemini-wallet/core';

// Initialize the communicator
const communicator = new Communicator({
  appMetadata: {
    name: 'My DApp',
    description: 'My decentralized application',
    url: 'https://mydapp.com',
    icons: ['https://mydapp.com/icon.png']
  },
  onDisconnectCallback: () => {
    console.log('Wallet disconnected');
  }
});

// Send a connect request
const connectMessage = {
  event: GeminiSdkEvent.SDK_CONNECT,
  requestId: crypto.randomUUID(),
  chainId: 1,
  origin: window.location.origin
};

const response = await communicator.postRequestAndWaitForResponse(connectMessage);
console.log('Connected:', response.data.address);
```

### Advanced Usage

```typescript
// Listen for specific events
communicator.onMessage(
  (message) => message.event === GeminiSdkEvent.ACCOUNTS_CHANGED
).then(response => {
  console.log('Accounts changed:', response.data);
});

// Send transaction
const txMessage = {
  event: GeminiSdkEvent.SDK_SEND_TRANSACTION,
  requestId: crypto.randomUUID(),
  chainId: 1,
  origin: window.location.origin,
  data: {
    from: '0x...',
    to: '0x...',
    value: '1000000000000000000', // 1 ETH in wei
    data: '0x'
  }
};

const txResponse = await communicator.postRequestAndWaitForResponse(txMessage);
console.log('Transaction hash:', txResponse.hash);
```

## API Reference

### Communicator

The main class for handling communication with Gemini Wallet.

#### Constructor Options

```typescript
interface CommunicatorConfigParams {
  appMetadata: AppMetadata;
  onDisconnectCallback?: () => void;
}

interface AppMetadata {
  name?: string;
  description?: string;
  url?: string;
  icons?: string[];
}
```

#### Methods

##### `postMessage(message: GeminiSdkMessage): Promise<void>`

Posts a message to the popup window without waiting for a response.

##### `postRequestAndWaitForResponse<M, R>(request: GeminiSdkMessage): Promise<R>`

Posts a request and waits for a matching response based on `requestId`.

##### `onMessage<M, R>(predicate: (message: Partial<M>) => boolean): Promise<R>`

Listens for messages that match the given predicate.

##### `waitForPopupLoaded(): Promise<Window>`

Ensures the popup is loaded and ready for communication.

### Message Types

#### GeminiSdkEvent

Enumeration of all supported events:

- `POPUP_LOADED` - Popup window has loaded
- `POPUP_UNLOADED` - Popup window was closed
- `POPUP_APP_CONTEXT` - App metadata sent to popup
- `SDK_CONNECT` - Connect wallet request
- `SDK_DISCONNECT` - Disconnect wallet request
- `SDK_SEND_TRANSACTION` - Send transaction request
- `SDK_SIGN_MESSAGE` - Sign message request
- `SDK_SIGN_TYPED_DATA` - Sign typed data request
- `SDK_SWITCH_CHAIN` - Switch chain request
- `ACCOUNTS_CHANGED` - Accounts changed event
- `CHAIN_CHANGED` - Chain changed event
- `DISCONNECT` - Disconnect event

### Constants

- `SDK_BACKEND_URL`: `"https://keys.gemini.com"`
- `DEFAULT_CHAIN_ID`: `1` (Ethereum mainnet)
- `POPUP_WIDTH`: `420`
- `POPUP_HEIGHT`: `650`

## Security Considerations

1. **Origin Validation**: All messages are validated against the expected origin
2. **Request ID Matching**: Responses are matched to requests using unique IDs
3. **User Consent**: All actions require explicit user approval in the popup
4. **No Private Keys**: The SDK never handles private keys directly

## Browser Support

- Chrome/Edge 80+
- Firefox 78+
- Safari 14+
- Opera 67+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.