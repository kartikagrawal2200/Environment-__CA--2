/**
 * Paper Consumption in the Digital Age — Main Client Logic
 * Features: Dark Mode, Nav Toggle, Stat Counters, Comparison Slider, Scroll Reveal, Form Handling, Chart.js
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. THEME TOGGLE (Dark / Light Mode)
  // =========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      const icon = themeToggleBtn.querySelector('svg');
      if (icon) {
        if (theme === 'dark') {
          // Sun icon
          icon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else {
          // Moon icon
          icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        }
      }
    }
    // Update Chart theme if exists
    if (window.activeChartInstance) {
      updateChartTheme(window.activeChartInstance);
    }
  }

  // Initial theme determination
  if (storedTheme) {
    applyTheme(storedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  // =========================================================================
  // 2. MOBILE NAVIGATION TOGGLE & ACCESSIBILITY
  // =========================================================================
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const navMenu = document.getElementById('navMenu');
  const navDropdowns = document.querySelectorAll('.nav-dropdown');

  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', () => {
      const isExpanded = mobileToggleBtn.getAttribute('aria-expanded') === 'true';
      mobileToggleBtn.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-open');
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      }
    });
  }

  // Dropdown mobile toggle support
  navDropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 860) {
          e.preventDefault();
          dropdown.classList.toggle('is-open');
        }
      });
    }
  });

  // =========================================================================
  // 3. ANIMATED KEY-STAT COUNTERS
  // =========================================================================
  const statCards = document.querySelectorAll('.stat-card');

  function animateCounter(el, target, duration = 1800) {
    let startTimestamp = null;
    const isDecimal = target % 1 !== 0;

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = easeProgress * target;

      el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = isDecimal ? target.toFixed(1) : target;
      }
    }

    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && statCards.length > 0) {
    const statObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counterEl = entry.target.querySelector('.stat-value');
          if (counterEl && !counterEl.dataset.counted) {
            counterEl.dataset.counted = 'true';
            const targetVal = parseFloat(counterEl.getAttribute('data-target') || '0');
            animateCounter(counterEl, targetVal);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    statCards.forEach(card => statObserver.observe(card));
  } else {
    // Fallback if no IntersectionObserver
    document.querySelectorAll('.stat-value').forEach(el => {
      el.textContent = el.getAttribute('data-target');
    });
  }

  // =========================================================================
  // 4. INTERACTIVE BEFORE / AFTER SLIDER ("Campus Transformation")
  // =========================================================================
  const sliderContainer = document.querySelector('.comparison-slider-container');
  const sliderWrapper = document.querySelector('.slider-wrapper');
  const afterPane = document.querySelector('.slider-pane-after');
  const sliderHandle = document.querySelector('.slider-handle');

  if (sliderWrapper && afterPane && sliderHandle) {
    let isDragging = false;

    function setSliderPosition(percentage) {
      const clamped = Math.max(0, Math.min(100, percentage));
      afterPane.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
      sliderHandle.style.left = `${clamped}%`;
      sliderHandle.setAttribute('aria-valuenow', Math.round(clamped));
    }

    function handleMove(clientX) {
      const rect = sliderWrapper.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }

    // Mouse Events
    sliderHandle.addEventListener('mousedown', () => { isDragging = true; });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX);
      }
    });

    // Click anywhere on wrapper to jump
    sliderWrapper.addEventListener('click', (e) => {
      handleMove(e.clientX);
    });

    // Touch Events for Mobile
    sliderHandle.addEventListener('touchstart', () => { isDragging = true; }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    }, { passive: true });

    // Keyboard Accessibility
    sliderHandle.addEventListener('keydown', (e) => {
      let currentVal = parseInt(sliderHandle.getAttribute('aria-valuenow') || '50', 10);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSliderPosition(currentVal - 5);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSliderPosition(currentVal + 5);
      }
    });
  }

  // =========================================================================
  // 5. SCROLL-REVEAL OBSERVER
  // =========================================================================
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // =========================================================================
  // 6. NEWSLETTER & PLEDGE FORM HANDLER
  // =========================================================================
  const newsletterForm = document.getElementById('homeNewsletterForm');
  const newsletterSuccess = document.getElementById('newsletterSuccess');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value.trim() : '';

      if (email && email.includes('@')) {
        // Save to localStorage simulation
        const existing = JSON.parse(localStorage.getItem('pledge_subscribers') || '[]');
        existing.push({ email, timestamp: new Date().toISOString() });
        localStorage.setItem('pledge_subscribers', JSON.stringify(existing));

        // Display success confirmation
        if (newsletterSuccess) {
          newsletterSuccess.style.display = 'block';
          newsletterSuccess.textContent = `Thank you for taking the pledge! We have sent a confirmation guide to ${email}.`;
        }
        newsletterForm.reset();
      }
    });
  }

  // =========================================================================
  // 7. BACK TO TOP BUTTON
  // =========================================================================
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =========================================================================
  // 8. CHART.JS INTEGRATION (Home Page Preview)
  // =========================================================================
  function updateChartTheme(chart) {
    if (!chart) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#BDC8BF' : '#4F554B';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    if (chart.options.scales) {
      if (chart.options.scales.x) {
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
      }
      if (chart.options.scales.y) {
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
      }
    }
    if (chart.options.plugins && chart.options.plugins.legend) {
      chart.options.plugins.legend.labels.color = textColor;
    }
    chart.update();
  }

  const chartCanvas = document.getElementById('homeFootprintChart');
  if (chartCanvas && typeof Chart !== 'undefined') {
    const ctx = chartCanvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#BDC8BF' : '#4F554B';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    const chartData = {
      labels: ['Water (L/1000 pgs)', 'CO2 (kg/1000 pgs)', 'Energy (kWh/1000 pgs)', 'Landfill (kg/1000 pgs)'],
      datasets: [
        {
          label: 'Traditional Virgin Paper',
          data: [10000, 11.2, 28, 4.5],
          backgroundColor: 'rgba(168, 83, 30, 0.85)', // Clay / Paper brown
          borderColor: '#A8531E',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: '100% Recycled Paper',
          data: [5000, 6.1, 16, 1.2],
          backgroundColor: 'rgba(42, 90, 40, 0.85)', // Forest green
          borderColor: '#2A5A28',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Optimized Digital Workflow',
          data: [120, 0.8, 4.2, 0.05],
          backgroundColor: 'rgba(30, 130, 118, 0.9)', // Digital Teal
          borderColor: '#1E8276',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };

    const myChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: "'IBM Plex Sans', sans-serif", size: 12, weight: '500' },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: '#0B242C',
            titleFont: { family: "'Fraunces', serif", size: 13 },
            bodyFont: { family: "'IBM Plex Sans', sans-serif", size: 12 },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { family: "'IBM Plex Sans', sans-serif" } },
            grid: { color: gridColor }
          },
          y: {
            type: 'logarithmic',
            ticks: {
              color: textColor,
              callback: function (value) {
                return Number(value).toLocaleString();
              }
            },
            grid: { color: gridColor },
            title: {
              display: true,
              text: 'Logarithmic Scale (Normalized Units)',
              color: textColor,
              font: { family: "'IBM Plex Sans', sans-serif", size: 11 }
            }
          }
        }
      }
    });

    window.activeChartInstance = myChart;

    // Filter toggles
    const filterBtns = document.querySelectorAll('.chart-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.getAttribute('data-mode');
        if (mode === 'water') {
          myChart.data.labels = ['Virgin Paper', 'Recycled Paper', 'Digital Workflow'];
          myChart.data.datasets = [{
            label: 'Water Consumption (Liters per 1,000 pages)',
            data: [10000, 5000, 120],
            backgroundColor: ['#A8531E', '#2A5A28', '#1E8276'],
            borderRadius: 6
          }];
          myChart.options.scales.y.type = 'linear';
        } else if (mode === 'carbon') {
          myChart.data.labels = ['Virgin Paper', 'Recycled Paper', 'Digital Workflow'];
          myChart.data.datasets = [{
            label: 'CO2 Equivalent Emissions (kg per 1,000 pages)',
            data: [11.2, 6.1, 0.8],
            backgroundColor: ['#A8531E', '#2A5A28', '#1E8276'],
            borderRadius: 6
          }];
          myChart.options.scales.y.type = 'linear';
        } else {
          // All metrics (logarithmic)
          myChart.data = chartData;
          myChart.options.scales.y.type = 'logarithmic';
        }
        myChart.update();
      });
    });
  }

})();
