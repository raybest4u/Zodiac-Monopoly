import '@testing-library/jest-dom';

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn().mockImplementation((callback: FrameRequestCallback) => {
    return setTimeout(() => callback(performance.now()), 16);
  })
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn().mockImplementation((id: number) => {
    clearTimeout(id);
  })
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
  }
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: jest.fn().mockReturnValue({
    save: jest.fn(),
    restore: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    arc: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    drawImage: jest.fn(),
    setTransform: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '12px Arial',
    textAlign: 'left',
    textBaseline: 'alphabetic'
  })
});

global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { setValueAtTime: jest.fn() }
  }),
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: { setValueAtTime: jest.fn() }
  }),
  destination: {},
  currentTime: 0
}));

global.Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  width: number = 0;
  height: number = 0;

  constructor() {
    setTimeout(() => {
      this.width = 100;
      this.height = 100;
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;

export const createMockCanvas = (width: number = 800, height: number = 600) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const createMockAudioContext = () => ({
  playSound: jest.fn().mockResolvedValue(undefined),
  pauseSound: jest.fn().mockResolvedValue(undefined),
  stopSound: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn(),
  createSoundGroup: jest.fn().mockReturnValue('mock-group-id'),
  preloadSound: jest.fn().mockResolvedValue(undefined),
  getAudioBuffer: jest.fn().mockReturnValue(null)
});

export const waitForAnimationFrame = (): Promise<void> => {
  return new Promise(resolve => {
    window.requestAnimationFrame(() => resolve());
  });
};

export const waitForTime = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};