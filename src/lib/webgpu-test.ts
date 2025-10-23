// Test if WebGPU is available and working
export async function testWebGPU(): Promise<{ available: boolean; error?: string; info?: any }> {
  try {
    if (!navigator.gpu) {
      return {
        available: false,
        error: "WebGPU not available in this browser/environment"
      };
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        available: false,
        error: "No WebGPU adapter found"
      };
    }

    const device = await adapter.requestDevice();
    
    return {
      available: true,
      info: {
        vendor: adapter.info?.vendor || 'Unknown',
        architecture: adapter.info?.architecture || 'Unknown',
        device: adapter.info?.device || 'Unknown',
        description: adapter.info?.description || 'Unknown',
        limits: {
          maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage,
          maxBufferSize: adapter.limits.maxBufferSize,
        }
      }
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
