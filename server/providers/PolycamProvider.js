import axios from 'axios';
import { ReconstructionProvider } from './ReconstructionProvider.js';

export class PolycamProvider extends ReconstructionProvider {
  constructor() {
    super('Polycam');
    this.apiToken = process.env.POLYCAM_API_TOKEN || '';
    this.baseUrl = process.env.POLYCAM_BASE_URL || 'https://poly.cam/api/v1';
  }

  isConfigured() {
    return Boolean(this.apiToken && this.apiToken.trim().length > 0);
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Aero3D-Intelligence/1.0',
    };
  }

  handleError(error) {
    if (!error.response) {
      return {
        status: 503,
        message: 'Polycam service temporarily unavailable. Network error or server offline.',
        code: 'POLYCAM_NETWORK_ERROR'
      };
    }

    const status = error.response.status;
    switch (status) {
      case 401:
        return { status: 401, message: 'Invalid Polycam credentials.', code: 'UNAUTHORIZED' };
      case 403:
        return { status: 403, message: 'Polycam API access is not enabled for this workspace.', code: 'FORBIDDEN' };
      case 404:
        return { status: 404, message: 'Capture not found.', code: 'NOT_FOUND' };
      case 429:
        return { status: 429, message: 'Polycam rate limit reached. Please try again later.', code: 'RATE_LIMITED' };
      default:
        if (status >= 500) {
          return { status: 502, message: 'Polycam service temporarily unavailable.', code: 'POLYCAM_SERVER_ERROR' };
        }
        return { status: status, message: error.response.data?.message || 'Polycam API error.', code: 'POLYCAM_API_ERROR' };
    }
  }

  async listCaptures() {
    if (!this.isConfigured()) {
      throw { status: 401, message: 'Invalid Polycam credentials. POLYCAM_API_TOKEN is missing.' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/captures`, { headers: this.getHeaders() });
      return response.data.captures || response.data;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async getCapture(id) {
    if (!this.isConfigured()) {
      throw { status: 401, message: 'Invalid Polycam credentials.' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/captures/${id}`, { headers: this.getHeaders() });
      return response.data;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async getArtifacts(id) {
    if (!this.isConfigured()) {
      throw { status: 401, message: 'Invalid Polycam credentials.' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/captures/${id}/artifacts`, { headers: this.getHeaders() });
      return response.data;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async exportModel(id, format = 'glb') {
    if (!this.isConfigured()) {
      throw { status: 401, message: 'Invalid Polycam credentials.' };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/captures/${id}/export`, { format }, { headers: this.getHeaders() });
      return response.data;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async createCapture(options) {
    if (!this.isConfigured()) {
      throw { status: 401, message: 'Invalid Polycam credentials.' };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/captures`, options, { headers: this.getHeaders() });
      return response.data;
    } catch (err) {
      throw this.handleError(err);
    }
  }
}
