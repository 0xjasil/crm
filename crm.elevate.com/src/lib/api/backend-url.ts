interface BackendSettings {
  apiUrl?: string;
  internalUrl?: string;
  publicUrl?: string;
}

export function resolveBackendUrl(settings: BackendSettings): string {
  if (settings.apiUrl) {
    return new URL(settings.apiUrl).toString().replace(/\/$/, '');
  }

  if (settings.internalUrl) {
    return new URL('/api/v1', settings.internalUrl).toString().replace(/\/$/, '');
  }

  const apiPath = settings.publicUrl || '/api/v1';
  return new URL(apiPath, 'http://127.0.0.1:5000').toString().replace(/\/$/, '');
}
