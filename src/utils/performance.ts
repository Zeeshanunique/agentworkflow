import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
  data?: any;
}

interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  initiatorType: string;
  transferSize: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private marks: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      // Monitor route changes
      this.setupRouteChangeMonitoring();
      // Monitor long tasks
      this.setupLongTaskMonitoring();
      // Monitor resource loading
      this.setupResourceMonitoring();
    }
  }

  private setupRouteChangeMonitoring() {
    let startTime = performance.now();
    
    const updateStartTime = () => {
      startTime = performance.now();
    };

    window.addEventListener('popstate', updateStartTime);
    
    // Monitor route changes completion
    const observer = new MutationObserver(() => {
      const duration = performance.now() - startTime;
      if (duration > 100) { // Only log slow route changes
        this.addMetric('routeChange', duration);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private setupLongTaskMonitoring() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.addMetric('longTask', entry.duration, {
          startTime: entry.startTime,
          name: entry.name
        });
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  private setupResourceMonitoring() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) { // Only log slow resource loads
          const resourceEntry = entry as PerformanceResourceTiming;
          this.addMetric('resourceLoad', entry.duration, {
            name: entry.name,
            type: resourceEntry.initiatorType
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  public mark(name: string) {
    const time = performance.now();
    this.marks.set(name, time);
    if (typeof window !== 'undefined') {
      performance.mark(name);
    }
  }

  public measure(name: string, startMark: string) {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      logger.warn(`Start mark "${startMark}" not found for measurement "${name}"`);
      return;
    }

    const duration = performance.now() - startTime;
    this.addMetric(name, duration);

    if (typeof window !== 'undefined') {
      try {
        performance.measure(name, startMark);
      } catch (e) {
        // Ignore errors from missing marks
      }
    }
  }

  private addMetric(name: string, duration: number, data?: any) {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      duration,
      data
    };

    this.metrics.push(metric);

    // Keep metrics array size under control
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-Math.floor(this.maxMetrics / 2));
    }

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', metric);
    }

    // Send metrics to server periodically
    this.scheduleMetricsUpload();
  }

  private debounceTimeout: NodeJS.Timeout | null = null;

  private scheduleMetricsUpload() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.uploadMetrics();
    }, 5000); // Upload metrics every 5 seconds
  }

  private async uploadMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToUpload = [...this.metrics];
    this.metrics = [];

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsToUpload),
      });
    } catch (error) {
      logger.error('Failed to upload metrics', error);
      // Put the metrics back in the queue
      this.metrics = [...metricsToUpload, ...this.metrics];
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public clearMetrics() {
    this.metrics = [];
    this.marks.clear();
    if (typeof window !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    ttfb: 0,
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0
  };

  // Time to First Byte
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    metrics.ttfb = navigationEntry.responseStart;
  }

  // First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime;
  }

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.lcp = lastEntry.startTime;
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Cumulative Layout Shift
  const clsObserver = new PerformanceObserver((entryList) => {
    let clsValue = 0;
    for (const entry of entryList.getEntries()) {
      const layoutShiftEntry = entry as LayoutShiftEntry;
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value;
      }
    }
    metrics.cls = clsValue;
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // First Input Delay
  const fidObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const firstInputEntry = entry as FirstInputEntry;
      metrics.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
    }
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  return metrics;
}

export function getResourceTimings(): ResourceTiming[] {
  const entries = performance.getEntriesByType('resource');
  return entries.map(entry => {
    const resourceEntry = entry as PerformanceResourceTiming;
    return {
      name: entry.name,
      duration: entry.duration,
      initiatorType: resourceEntry.initiatorType,
      transferSize: resourceEntry.transferSize
    };
  });
}

export function clearPerformanceMetrics(): void {
  performance.clearMarks();
  performance.clearMeasures();
  performance.clearResourceTimings();
} 