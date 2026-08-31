import { DemoProvider } from './DemoProvider.js';
import { PolycamProvider } from './PolycamProvider.js';
import { ColmapProvider } from './ColmapProvider.js';

export class ReconstructionFactory {
  static getProvider(modeOverride = null) {
    const mode = (modeOverride || process.env.PHOTOGRAMMETRY_ENGINE || process.env.RECONSTRUCTION_ENGINE || 'demo').toLowerCase();

    if (mode === 'colmap') {
      const colmap = new ColmapProvider();
      if (colmap.isConfigured()) {
        return colmap;
      }
      console.warn('[ReconstructionFactory] COLMAP selected but binary is unavailable/blocked. Falling back to DemoProvider.');
      return new DemoProvider();
    }

    if (mode === 'polycam') {
      const polycam = new PolycamProvider();
      if (polycam.isConfigured()) {
        return polycam;
      }
      console.warn('[ReconstructionFactory] Polycam selected but API token is unconfigured. Falling back to DemoProvider.');
      return new DemoProvider();
    }

    return new DemoProvider();
  }
}
