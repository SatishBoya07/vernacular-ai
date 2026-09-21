export interface BridgeLogEntry {
  timestamp: number;
  type: 'npu' | 'mic' | 'camera' | 'token' | 'system';
  message: string;
  value?: number | boolean | string;
}

export interface BridgeEmitterOptions {
  intervalMs?: number;
}

export function createBridgeEmitter(onLog: (entry: BridgeLogEntry) => void, options?: BridgeEmitterOptions): () => void {
  const npuInterval = setInterval(() => {
    const value = Math.floor(Math.random() * 66) + 30; // 30-95
    onLog({
      timestamp: Date.now(),
      type: 'npu',
      message: `NPU memory allocation: ${value}%`,
      value
    });
  }, 2000);

  const micInterval = setInterval(() => {
    const active = Math.random() > 0.5;
    onLog({
      timestamp: Date.now(),
      type: 'mic',
      message: `Microphone: ${active ? 'ACTIVE' : 'IDLE'}`,
      value: active
    });
  }, 3000);

  const cameraStates: ('READY' | 'CAPTURING' | 'STANDBY')[] = ['READY', 'STANDBY', 'CAPTURING'];
  const cameraInterval = setInterval(() => {
    const status = cameraStates[Math.floor(Math.random() * cameraStates.length)];
    onLog({
      timestamp: Date.now(),
      type: 'camera',
      message: `Camera Sensor: ${status}`,
      value: status
    });
  }, 4000);

  const tokenInterval = setInterval(() => {
    const valueStr = (Math.random() * 33 + 12).toFixed(1); // 12-45
    const value = parseFloat(valueStr);
    onLog({
      timestamp: Date.now(),
      type: 'token',
      message: `Token generation: ${value} tok/s`,
      value
    });
  }, 1000);

  const systemMessages = [
    'Model loaded: qwen-2.5-7b-instruct',
    'NPU thermal throttle: nominal',
    'Cache hit ratio: 94%',
    'Inference batch queued',
    'Memory pool defragmented',
    'Camera ISP pipeline synchronized'
  ];
  
  const systemInterval = setInterval(() => {
    const message = systemMessages[Math.floor(Math.random() * systemMessages.length)];
    onLog({
      timestamp: Date.now(),
      type: 'system',
      message
    });
  }, 5000);

  return () => {
    clearInterval(npuInterval);
    clearInterval(micInterval);
    clearInterval(cameraInterval);
    clearInterval(tokenInterval);
    clearInterval(systemInterval);
  };
}
