// wrapper around window.api
export async function invoke(channel: string, ...args: any[]) {
  // @ts-ignore
  if (window.api && window.api.invoke) {
    // @ts-ignore
    return window.api.invoke(channel, ...args);
  } else {
    console.error('window.api.invoke is not available');
    // return validation mock in browser environment if needed, or throw
    throw new Error('Electron API not available');
  }
}
