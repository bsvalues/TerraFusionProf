/**
 * TerraFusionPro - Workflow Progress Component
 * Displays current workflow progress with step indicators
 */

import React from 'react';

const WorkflowProgress = ({ workflow, onStepClick }) => {
  if (!workflow) return null;
  
  const { name, steps, currentStep } = workflow;
  
  return (
    <div className="workflow-progress">
      <div className="workflow-header">
        <h2 className="workflow-title">{name}</h2>
        <div className="workflow-indicators">
          <span className="current-step-indicator">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>
      
      <div className="workflow-steps">
        {steps.map((step, index) => {
          // Determine step status
          let statusClass = '';
          if (index < currentStep) statusClass = 'completed';
          else if (index === currentStep) statusClass = 'current';
          else statusClass = 'upcoming';
          
          return (
            <div 
              key={step.id} 
              className={`workflow-step ${statusClass}`}
              onClick={() => onStepClick(step, index)}
            >
              <div className="step-indicator">
                {index < currentStep ? (
                  <span className="step-check">✓</span>
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
              </div>
              
              <div className="step-details">
                <div className="step-name">{step.label}</div>
                {index < currentStep && <div className="step-status">Completed</div>}
                {index === currentStep && <div className="step-status">In Progress</div>}
              </div>
              
              {index < steps.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowProgress;