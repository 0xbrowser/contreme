# HFT Frontend Performance Optimization Playground

An interactive playground for exploring frontend performance optimization strategies used in high-frequency trading applications. Built with Next.js, TypeScript, TailwindCSS, Zustand, Radix UI, and Recharts.

## Features

- **8 Interactive Performance Demos**: Explore different optimization techniques
- **Real-time Metrics**: Visualize performance metrics with charts and counters
- **Light/Dark Theme**: Global theme toggle with Claude-style minimal design
- **Modular Architecture**: Each demo is self-contained and easily extensible
- **Mock Server**: API routes for simulating high-frequency data streams

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Performance Demos

### 1. WebSocket Batching
**Route**: `/demos/websocket-batching`

Compare immediate WebSocket updates vs batched updates for high-frequency data streams.

- **Metrics**: Rendered rows/sec, update count, queue length, setState calls, batch processing time
- **Visualizations**: Message queue chart, FPS line chart, rendered rows counter
- **Interaction**: Toggle between immediate and batched updates, start/stop data stream

### 2. Virtual Scrolling
**Route**: `/demos/virtual-scrolling`

Compare regular list rendering vs virtualized rendering for large datasets (100k items).

- **Metrics**: DOM node count, FPS, scroll smoothness
- **Visualizations**: DOM counter, FPS curve
- **Interaction**: Toggle virtual scrolling, scroll through large list

### 3. Web Workers
**Route**: `/demos/web-workers`

Compare heavy computation on main thread vs Web Worker for non-blocking UI.

- **Metrics**: Main thread usage, Worker execution time, UI response time
- **Visualizations**: CPU usage chart, FPS curve
- **Interaction**: Toggle between main thread and Web Worker computation

### 4. Component Memoization
**Route**: `/demos/component-memoization`

Compare normal component rendering vs memoized components to prevent unnecessary re-renders.

- **Metrics**: Render count, skipped renders, diff time
- **Visualizations**: Render counter, component render heatmap
- **Interaction**: Update parent state, toggle memoization

### 5. Debounce
**Route**: `/demos/debounce`

Compare immediate event handling vs debounced event handling.

- **Metrics**: Request count, trigger interval, delay time
- **Visualizations**: Request timeline chart, counter
- **Interaction**: Rapidly click button, toggle debounce on/off

### 6. Throttle
**Route**: `/demos/throttle`

Compare immediate event handling vs throttled event handling.

- **Metrics**: Request count, throttle window, dropped events
- **Visualizations**: Request frequency bar chart
- **Interaction**: Rapid typing in search input, toggle throttle on/off

### 7. Hardware Acceleration
**Route**: `/demos/hardware-acceleration`

Compare CSS animations using top/left vs transform/opacity for GPU acceleration.

- **Metrics**: FPS, layout count, paint count, composite time
- **Visualizations**: FPS curve, Layout/Paint/Composite metrics
- **Interaction**: Animate element, toggle hardware acceleration

### 8. Request Coalescing / Batching
**Route**: `/demos/request-coalescing`

Compare individual API requests vs batched requests.

- **Metrics**: Request count, total time, peak QPS, batch count
- **Visualizations**: Request bar chart, batch count
- **Interaction**: Send multiple requests, toggle batching

## API Routes

### `/api/stream`
Server-Sent Events (SSE) endpoint for streaming high-frequency data.

### `/api/websocket`
Mock WebSocket endpoint (HTTP-based simulation).

### `/api/batch`
Batch processing endpoint for coalescing multiple requests.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── demos/            # Demo pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── components/
│   ├── demos/            # Demo-specific components
│   ├── shared/           # Shared components (charts, metrics)
│   ├── ThemeProvider.tsx # Theme provider
│   └── ThemeToggle.tsx   # Theme toggle component
├── store/
│   └── themeStore.ts     # Zustand theme store
└── package.json
```

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **TailwindCSS**: Utility-first CSS
- **Zustand**: Lightweight state management
- **Radix UI**: Accessible component primitives
- **Recharts**: Charting library
- **lucide-react**: Icon library

## Performance Best Practices Demonstrated

1. **Batching**: Group multiple state updates to reduce re-renders
2. **Virtualization**: Render only visible items in large lists
3. **Web Workers**: Offload heavy computation from main thread
4. **Memoization**: Prevent unnecessary component re-renders
5. **Debouncing**: Delay function execution until after events stop
6. **Throttling**: Limit function execution rate
7. **Hardware Acceleration**: Use GPU-accelerated CSS properties
8. **Request Coalescing**: Batch API requests to reduce overhead

## Contributing

This is a demonstration project. Feel free to fork and extend with additional demos or improvements.

## License

MIT License - see LICENSE file for details

