/**
 * TerraFusionPro - Workflow Progress Component
 * Visualizes multi-step workflows and their progression
 */

import React from 'react';

/**
 * WorkflowProgress Component
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of step objects with name and label
 * @param {number} props.currentStep - Current active step index
 * @param {Array} props.visitedSteps - Array of visited step indices
 * @param {Function} props.onStepClick - Handler for step click event
 * @param {boolean} props.allowNavigation - Whether to allow navigation by clicking steps
 * @param {string} props.orientation - Layout orientation ('horizontal' or 'vertical')
 * @param {boolean} props.showLabels - Whether to show step labels
 * @param {boolean} props.showPercentage - Whether to show percentage progress
 */
const WorkflowProgress = ({
  steps = [],
  currentStep = 0,
  visitedSteps = [],
  onStepClick,
  allowNavigation = true,
  orientation = 'horizontal',
  showLabels = true,
  showPercentage = true
}) => {
  // Calculate progress percentage
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  
  // Handle step click
  const handleStepClick = (index) => {
    if (!allowNavigation) return;
    
    // Only allow navigation to visited steps or the next step
    if (visitedSteps.includes(index) || index === currentStep + 1) {
      if (onStepClick) {
        onStepClick(index);
      }
    }
  };
  
  // Determine if step is clickable
  const isStepClickable = (index) => {
    if (!allowNavigation) return false;
    return visitedSteps.includes(index) || index === currentStep + 1;
  };
  
  // Get status class for a step
  const getStepStatusClass = (index) => {
    if (index === currentStep) return 'active';
    if (index < currentStep || visitedSteps.includes(index)) return 'completed';
    return 'pending';
  };
  
  // Get step status for aria-label
  const getStepStatus = (index) => {
    if (index === currentStep) return 'current step';
    if (index < currentStep) return 'completed step';
    return 'pending step';
  };
  
  return (
    <div className={`workflow-progress ${orientation}`}>
      {showPercentage && (
        <div className="workflow-percentage">
          <span className="percentage-value">{progress}%</span>
          <span className="percentage-label">Complete</span>
        </div>
      )}
      
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`workflow-step ${getStepStatusClass(index)} ${isStepClickable(index) ? 'clickable' : ''}`}
            onClick={() => handleStepClick(index)}
            aria-label={`${step.label}: ${getStepStatus(index)}`}
            tabIndex={isStepClickable(index) ? 0 : -1}
            role={isStepClickable(index) ? 'button' : 'presentation'}
          >
            <div className="step-indicator">
              {index < currentStep || visitedSteps.includes(index) ? (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <span className="step-number">{index + 1}</span>
              )}
            </div>
            
            {showLabels && (
              <div className="step-label">
                {step.label}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="workflow-progress-bar">
        <div 
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      
      <div className="workflow-status">
        <div className="current-step-name">
          <span className="status-label">Current Step:</span>
          <span className="step-name">{steps[currentStep]?.label}</span>
        </div>
        
        <div className="steps-count">
          <span className="steps-completed">{Math.max(currentStep, 0) + 1}</span>
          <span className="steps-separator">/</span>
          <span className="steps-total">{steps.length}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;