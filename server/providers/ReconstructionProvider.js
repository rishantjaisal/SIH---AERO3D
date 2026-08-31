/**
 * Abstract ReconstructionProvider interface
 * Unified contract for photogrammetry providers (PolycamProvider, DemoProvider)
 */
export class ReconstructionProvider {
  constructor(name) {
    this.name = name;
  }

  async listCaptures() {
    throw new Error('Method listCaptures() must be implemented');
  }

  async getCapture(id) {
    throw new Error('Method getCapture(id) must be implemented');
  }

  async getArtifacts(id) {
    throw new Error('Method getArtifacts(id) must be implemented');
  }

  async exportModel(id, format) {
    throw new Error('Method exportModel(id, format) must be implemented');
  }

  async createCapture(options) {
    throw new Error('Method createCapture(options) must be implemented');
  }
}
