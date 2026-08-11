document.addEventListener('DOMContentLoaded', () => {
  const API_ENDPOINT = 'https://mental-health-predection-score.onrender.com/predict'; // Update this to your FastAPI endpoint

  // Form & Card Elements
  const form = document.getElementById('prediction-form');
  const predictBtn = document.getElementById('predict-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnText = predictBtn.querySelector('.btn-text');
  
  const assessmentCard = document.getElementById('assessment-card');
  const resultCard = document.getElementById('result-card');
  const errorBanner = document.getElementById('error-banner');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');

  // Sliders and Display Badges
  const sliders = [
    { id: 'avg_daily_usage_hours', unit: ' hrs' },
    { id: 'daily_unlocks', unit: ' times' },
    { id: 'study_hours', unit: ' hrs' },
    { id: 'physical_activity_hours', unit: ' hrs' },
    { id: 'sleep_hours_per_night', unit: ' hrs' }
  ];

  // Action Buttons
  const analyzeAgainBtn = document.getElementById('analyze-again-btn');
  const resetFormBtn = document.getElementById('reset-form-btn');

  // Sync Sliders with Badges
  sliders.forEach(item => {
    const inputEl = document.getElementById(item.id);
    const badgeEl = document.getElementById(`val-${item.id}`);

    if (inputEl && badgeEl) {
      inputEl.addEventListener('input', (e) => {
        badgeEl.textContent = `${e.target.value}${item.unit}`;
      });
    }
  });

  // Handle Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorBanner();
    clearFieldErrors();

    const formData = getFormData();
    
    // Validate Form Input
    if (!validateFormData(formData)) {
      return;
    }

    // Set Loading State
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const data = await response.json();

      if (data && typeof data.predicted_mental_health_score === 'number') {
        showResults(data.predicted_mental_health_score, formData);
      } else {
        throw new Error('Invalid JSON structure returned by server.');
      }

    } catch (err) {
      console.error('Prediction API Error:', err);
      showErrorBanner(
        'Unable to connect to the prediction server.',
        'Please make sure FastAPI is running at http://127.0.0.1:8000'
      );
    } finally {
      setLoading(false);
    }
  });

  // Extract values from form
  function getFormData() {
    return {
      age: parseInt(document.getElementById('age').value, 10),
      gender: document.getElementById('gender').value,
      country: document.getElementById('country').value,
      academic_level: document.getElementById('academic_level').value,
      most_used_platform: document.getElementById('most_used_platform').value,
      purpose_of_use: document.getElementById('purpose_of_use').value,
      avg_daily_usage_hours: parseFloat(document.getElementById('avg_daily_usage_hours').value),
      daily_unlocks: parseInt(document.getElementById('daily_unlocks').value, 10),
      study_hours: parseFloat(document.getElementById('study_hours').value),
      physical_activity_hours: parseFloat(document.getElementById('physical_activity_hours').value),
      sleep_hours_per_night: parseFloat(document.getElementById('sleep_hours_per_night').value),
      stress_level: document.getElementById('stress_level').value
    };
  }

  // Frontend Input Validation
  function validateFormData(data) {
    let isValid = true;

    if (isNaN(data.age) || data.age < 10 || data.age > 100) {
      setFieldError('age', 'Age must be between 10 and 100');
      isValid = false;
    }

    if (isNaN(data.avg_daily_usage_hours) || data.avg_daily_usage_hours < 0 || data.avg_daily_usage_hours > 24) {
      setFieldError('avg_daily_usage_hours', 'Hours must be between 0 and 24');
      isValid = false;
    }

    if (isNaN(data.daily_unlocks) || data.daily_unlocks < 0) {
      setFieldError('daily_unlocks', 'Daily unlocks must be 0 or greater');
      isValid = false;
    }

    if (isNaN(data.study_hours) || data.study_hours < 0 || data.study_hours > 24) {
      setFieldError('study_hours', 'Study hours must be between 0 and 24');
      isValid = false;
    }

    if (isNaN(data.physical_activity_hours) || data.physical_activity_hours < 0 || data.physical_activity_hours > 24) {
      setFieldError('physical_activity_hours', 'Physical activity hours must be between 0 and 24');
      isValid = false;
    }

    if (isNaN(data.sleep_hours_per_night) || data.sleep_hours_per_night < 0 || data.sleep_hours_per_night > 24) {
      setFieldError('sleep_hours_per_night', 'Sleep hours must be between 0 and 24');
      isValid = false;
    }

    return isValid;
  }

  function setFieldError(fieldId, message) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearFieldErrors() {
    const errorEls = document.querySelectorAll('.field-error');
    errorEls.forEach(el => el.textContent = '');
  }

  // UI State Handlers
  function setLoading(isLoading) {
    predictBtn.disabled = isLoading;
    if (isLoading) {
      btnSpinner.classList.remove('hidden');
      btnText.textContent = 'Analyzing...';
    } else {
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Analyze My Mental Health';
    }
  }

  function showErrorBanner(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorBanner.classList.remove('hidden');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideErrorBanner() {
    errorBanner.classList.add('hidden');
  }

  // Display Prediction Results
  function showResults(score, inputData) {
    // Round to 2 decimal places
    const formattedScore = score.toFixed(2);
    document.getElementById('score-display').textContent = formattedScore;

    // Interpretations:
    // 8–10 → Excellent
    // 6–7.99 → Good
    // 4–5.99 → Moderate
    // Below 4 → Needs Attention
    const badgeEl = document.getElementById('interpretation-badge');
    const meterProgress = document.getElementById('meter-progress');
    
    // Total circumference for r=68 is 2 * Math.PI * 68 = 427.25
    const circumference = 427.25;
    const clampedScore = Math.min(Math.max(score, 0), 10);
    const offset = circumference - (clampedScore / 10) * circumference;

    badgeEl.className = 'interpretation-badge';

    let strokeColor = 'var(--accent-primary)';

    if (clampedScore >= 8) {
      badgeEl.textContent = 'Excellent';
      badgeEl.classList.add('badge-excellent');
      strokeColor = 'var(--color-excellent)';
    } else if (clampedScore >= 6) {
      badgeEl.textContent = 'Good';
      badgeEl.classList.add('badge-good');
      strokeColor = 'var(--color-good)';
    } else if (clampedScore >= 4) {
      badgeEl.textContent = 'Moderate';
      badgeEl.classList.add('badge-moderate');
      strokeColor = 'var(--color-moderate)';
    } else {
      badgeEl.textContent = 'Needs Attention';
      badgeEl.classList.add('badge-attention');
      strokeColor = 'var(--color-attention)';
    }

    meterProgress.style.stroke = strokeColor;
    
    // Trigger meter stroke animation
    setTimeout(() => {
      meterProgress.style.strokeDashoffset = offset;
    }, 50);

    // Populate Lifestyle Summary
    document.getElementById('sum-usage').textContent = `${inputData.avg_daily_usage_hours} hrs/day (${inputData.most_used_platform})`;
    document.getElementById('sum-unlocks').textContent = `${inputData.daily_unlocks} times`;
    document.getElementById('sum-sleep').textContent = `${inputData.sleep_hours_per_night} hrs`;
    document.getElementById('sum-study').textContent = `${inputData.study_hours} hrs`;
    document.getElementById('sum-activity').textContent = `${inputData.physical_activity_hours} hrs`;
    document.getElementById('sum-stress').textContent = inputData.stress_level;

    // Show Result Card & Scroll
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Analyze Again Button
  analyzeAgainBtn.addEventListener('click', () => {
    assessmentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Reset Form Button
  resetFormBtn.addEventListener('click', () => {
    form.reset();
    clearFieldErrors();
    hideErrorBanner();

    // Reset Sliders UI Badges
    sliders.forEach(item => {
      const inputEl = document.getElementById(item.id);
      const badgeEl = document.getElementById(`val-${item.id}`);
      if (inputEl && badgeEl) {
        badgeEl.textContent = `${inputEl.value}${item.unit}`;
      }
    });

    // Hide result card and scroll to top
    resultCard.classList.add('hidden');
    
    // Reset circular meter animation state
    const meterProgress = document.getElementById('meter-progress');
    if (meterProgress) {
      meterProgress.style.strokeDashoffset = '427.25';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});