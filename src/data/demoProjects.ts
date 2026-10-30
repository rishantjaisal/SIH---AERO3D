/**
 * Showcase ("demo") project details for the INNOTECH 2026 presentation.
 *
 * These are published EXTERNAL datasets with PREPROCESSED outputs. AERO3D did not capture the imagery and did not
 * run the reconstruction for them. Every figure below is taken from the dataset's own manifests (see `verifiedFrom`);
 * anything the sources do not state is left out rather than guessed.
 *
 * The project records themselves (id, name, model_url, thumbnail) live in ProjectContext / DemoProvider; this file
 * holds the extra detail-page content, keyed by project id.
 */

export interface DemoSourceLink {
  label: string;
  url: string;
  note?: string;
}

export interface DemoGalleryImage {
  /** Local, optimized thumbnail under /public. Missing files degrade to a placeholder. */
  src: string;
  caption: string;
  /** Original filename in the dataset, shown so judges can find it. */
  file?: string;
  /** Link to the full-resolution original. */
  href?: string;
}

export interface DemoProjectInfo {
  id: string;
  category: string;
  outputFormat: string;
  /** Text shown on the card / overview. */
  summary: string;
  description: string;
  applications: string[];
  /** Short badges, e.g. External Sample Dataset. */
  labels: string[];
  /** Verified number of input photographs, or null when unknown. */
  inputImageCount: number | null;
  /** Verified facts shown as labelled rows. Each row says where it came from. */
  facts: { label: string; value: string; verifiedFrom?: string }[];
  gallery: DemoGalleryImage[];
  galleryNote: string;
  /** What the shipped model file actually is. */
  outputNote: string;
  /** True when the output file is shipped in this repository. */
  outputShipped: boolean;
  sources: DemoSourceLink[];
  licence: { name: string; url: string; attribution: string };
}

const HF = 'https://huggingface.co/datasets/Matt1up/drone-building-scans';
const GH = 'https://github.com/Matt1Up/drone-building-scans-dataset';

export const DEMO_PROJECT_INFO: Record<string, DemoProjectInfo> = {
  'demo-proj-004': {
    id: 'demo-proj-004',
    category: 'Building Reconstruction',
    outputFormat: 'Textured GLB',
    summary: 'Textured 3D model of a flat-roof commercial building, reconstructed from 951 drone photographs.',
    description:
      'A published drone-photogrammetry scan of a flat-roof commercial building (the "flat-roof" scan of the Drone Building Scans dataset). ' +
      'The dataset provides the source photographs with camera and GPS metadata, solved camera poses and a textured GLB model. ' +
      'The model is loaded here in the AERO3D viewer so it can be orbited, measured and annotated.',
    applications: ['Building inspection', 'Digital documentation', 'Dimensional measurement', 'Asset management'],
    labels: ['Demo Project', 'External Sample Dataset', 'Preprocessed Demo Output'],
    inputImageCount: 951,
    facts: [
      { label: 'Input photographs', value: '951', verifiedFrom: 'manifest/flat-roof/summary.json' },
      { label: 'Image size', value: '4096 × 3072 px (all images)', verifiedFrom: 'manifest/flat-roof/images.csv' },
      { label: 'GPS metadata', value: 'Present and valid on all 951 images', verifiedFrom: 'summary.json: gps_invalid = 0' },
      { label: 'Camera poses', value: '951 images with solved poses (COLMAP export)', verifiedFrom: 'poses/flat-roof/colmap/images.txt' },
      { label: 'Capture date', value: '22 Aug 2026 (EXIF, 18:17–19:13)', verifiedFrom: 'manifest/flat-roof/images.csv' },
      { label: 'Source data size', value: '10.61 GiB of JPEGs', verifiedFrom: 'summary.json' },
      { label: 'Output', value: 'Textured GLB mesh' },
    ],
    gallery: [
      {
        src: '/models/projects/industrial-building/preview.jpg',
        caption: 'Reference reconstruction render (dataset preview image)',
        file: 'preview/flat-roof.jpg',
        href: `${GH}/blob/main/preview/flat-roof.jpg`,
      },
      {
        src: '/models/projects/industrial-building/inputs/DJI_20260822183442_0005_D.jpg',
        caption: 'Sample input photograph',
        file: 'DJI_20260822183442_0005_D.JPG',
        href: `${HF}/resolve/main/flat-roof/images/DJI_20260822183442_0005_D.JPG`,
      },
    ],
    galleryNote:
      'Only a few optimized thumbnails are bundled. The 951 full-resolution originals (about 11 GB) stay in the original dataset.',
    outputNote:
      'The model shown is a web-optimized derivative of the published flat-roof.glb (about 22 MB original): mesh simplified to ~99K triangles, ' +
      'texture resized to 2048 px, geometry compressed. Fine detail of the original is reduced. The full file is linked below.',
    outputShipped: true,
    sources: [
      { label: 'Original dataset (Hugging Face)', url: HF },
      { label: 'Dataset GitHub repository (manifests, poses, preview)', url: GH },
      { label: 'Reference imagery (preview/flat-roof.jpg)', url: `${GH}/blob/main/preview/flat-roof.jpg` },
      { label: 'Published 3D output (flat-roof.glb, ~22 MB)', url: `${HF}/resolve/main/flat-roof/model/flat-roof.glb` },
      { label: 'Sample input photograph', url: `${HF}/resolve/main/flat-roof/images/DJI_20260822183442_0005_D.JPG` },
    ],
    licence: {
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      attribution: 'Drone Building Scans — Matthew Guertin, 2026. CC BY 4.0. Model optimized for web.',
    },
  },

  'demo-proj-005': {
    id: 'demo-proj-005',
    category: 'Cultural Heritage / Archaeological Documentation',
    outputFormat: 'Point cloud (converted for the viewer)',
    summary: 'UAV-photograph-derived 3D point cloud of an archaeological site, with semantic-classification files.',
    description:
      'A published dataset of UAV aerial photographs of an archaeological site. The published output is a 3D point cloud with supporting ' +
      'semantic-classification text files. It is a point cloud, not a textured mesh, and is presented as such.',
    applications: ['Heritage preservation', 'Archaeological documentation', 'Structural inspection', 'Measurement'],
    labels: ['Demo Project', 'External Sample Dataset', 'Preprocessed Demo Output'],
    inputImageCount: null,
    facts: [
      { label: 'Input', value: 'UAV aerial photographs (count not yet verified)' },
      { label: 'Published output', value: '3D point cloud + semantic-classification text files' },
      { label: 'Licence', value: 'CC BY 4.0' },
    ],
    gallery: [],
    galleryNote:
      'Input thumbnails and dataset facts (image count, location, point count) are added only after the actual dataset files have been inspected.',
    outputNote:
      'Point cloud shown with its original geometry and any colours the file contains. No surface, texture, scale or accuracy has been added.',
    outputShipped: false,
    sources: [{ label: 'Original dataset (Mendeley Data)', url: 'https://data.mendeley.com/datasets/ydpn8xnx24/1' }],
    licence: {
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      attribution: 'See the Mendeley Data record for the authors and the required citation.',
    },
  },
};

export const getDemoInfo = (id: string | undefined | null): DemoProjectInfo | undefined =>
  id ? DEMO_PROJECT_INFO[id] : undefined;
