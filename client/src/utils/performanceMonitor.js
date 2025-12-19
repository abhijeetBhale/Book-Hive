/**
 * Performance Monitoring Utility
 * Tracks and reports performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isEnabled = import.meta.env.PROD; // Only enable in production
    
    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  /**
   * Initialize performance observers
   */
  initializeObservers() {
    // Core Web Vitals
    this.observeWebVitals();
    
    // Navigation timing
    this.observeNavigation();
    
    // Resource timing
    this.observeResources();
    
    // Long tasks
    this.observeLongTasks();
  }

  /**
   * Observe Core Web Vitals (CLS, FID, LCP)
   */
  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported');
      }
    }
  }

  /**
   * Observe navigation timing
   */
  observeNavigation() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.recordMetric('TTFB', navigation.responseStart - navigation.requestStart);
          this.recordMetric('DOM_LOAD', navigation.domContentLoadedEventEnd - navigation.navigationStart);
          this.recordMetric('FULL_LOAD', navigation.loadEventEnd - navigation.navigationStart);
        }
      }, 0);
    });
  }

  /**
   * Observe resource timing
   */
  observeResources() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            // Track slow resources
            if (entry.duration > 1000) { // Resources taking more than 1 second
              this.recordMetric('SLOW_RESOURCE', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported');
      }
    }
  }

  /**
   * Observe long tasks (blocking main thread)
   */
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('LONG_TASK', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported');
      }
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value) {
    if (!this.isEnabled) return;

    const timestamp = Date.now();
    const metric = {
      name,
      value,
      timestamp,
      url: window.location.pathname
    };

    // Store in memory
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(metric);

    // Log important metrics
    if (['LCP', 'FID', 'CLS', 'TTFB'].includes(name)) {
      console.log(`📊 ${name}:`, value);
    }

    // Send to analytics (implement your analytics service here)
    this.sendToAnalytics(metric);
  }

  /**
   * Send metrics to analytics service
   */
  sendToAnalytics(metric) {
    // Implement your analytics service integration here
    // Example: Google Analytics, Mixpanel, etc.
    
    // For now, just store in localStorage for debugging
    try {
      const stored = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
      stored.push(metric);
      
      // Keep only last 100 metrics
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }
      
      localStorage.setItem('performanceMetrics', JSON.stringify(stored));
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const numericValues = values
          .map(v => typeof v.value === 'number' ? v.value : 0)
          .filter(v => v > 0);
        
        if (numericValues.length > 0) {
          summary[name] = {
            count: values.length,
            average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            latest: values[values.length - 1].value
          };
        }
      }
    }
    
    return summary;
  }

  /**
   * Mark custom timing
   */
  mark(name) {
    if (!this.isEnabled) return;
    
    performance.mark(name);
    this.recordMetric('CUSTOM_MARK', {
      name,
      timestamp: performance.now()
    });
  }

  /**
   * Measure between two marks
   */
  measure(name, startMark, endMark) {
    if (!this.isEnabled) return;
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      this.recordMetric('CUSTOM_MEASURE', {
        name,
        duration: measure.duration
      });
    } catch (error) {
      console.warn('Failed to measure:', error);
    }
  }

  /**
   * Track user interactions
   */
  trackInteraction(action, element) {
    if (!this.isEnabled) return;
    
    this.recordMetric('USER_INTERACTION', {
      action,
      element: element?.tagName || 'unknown',
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.cleanup();
});

export default performanceMonitor;