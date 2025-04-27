/**
 * TerraFusionPro - Workflow Progress Component
 * Visualizes workflow progress for different process types
 */

import React from 'react';

/**
 * WorkflowProgress Component
 * @param {Object} props - Component props
 * @param {string} props.type - The type of workflow ('property', 'report', 'form', etc.)
 * @param {string} props.currentStep - The current step in the workflow
 * @param {Object[]} props.steps - Array of step objects
 * @param {function} props.onStepClick - Function to call when a step is clicked
 */
const WorkflowProgress = ({ 
  type = 'property', 
  currentStep = '',
  steps = [],
  onStepClick = () => {}
}) => {
  // Get workflow steps based on type if not provided
  const workflowSteps = steps.length > 0 ? steps : getDefaultWorkflowSteps(type);
  
  // Find the index of the current step
  const currentStepIndex = workflowSteps.findIndex(step => step.id === currentStep);
  
  // Handle step click
  const handleStepClick = (step) => {
    // Only allow clicking on completed steps
    if (step.status === 'completed' || step.status === 'current') {
      onStepClick(step);
    }
  };
  
  return (
    <div className={`workflow-progress ${type}-workflow`}>
      <div className="workflow-title">
        {getWorkflowTitle(type)} Workflow
      </div>
      
      <div className="workflow-steps">
        {workflowSteps.map((step, index) => {
          // Determine step status if not provided
          let status = step.status;
          if (!status) {
            if (index < currentStepIndex) {
              status = 'completed';
            } else if (index === currentStepIndex) {
              status = 'current';
            } else {
              status = 'pending';
            }
          }
          
          return (
            <div 
              key={step.id} 
              className={`workflow-step ${status}`}
              onClick={() => handleStepClick({ ...step, status })}
            >
              <div className="step-indicator">
                {status === 'completed' ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
              </div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                {step.description && (
                  <div className="step-description">{step.description}</div>
                )}
              </div>
              {index < workflowSteps.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Get the workflow title based on type
 * @param {string} type - The workflow type
 * @returns {string} - The title
 */
const getWorkflowTitle = (type) => {
  switch (type) {
    case 'property':
      return 'Property Management';
    case 'report':
      return 'Report Generation';
    case 'form':
      return 'Form Completion';
    case 'analysis':
      return 'Data Analysis';
    default:
      return 'Process';
  }
};

/**
 * Get default workflow steps based on type
 * @param {string} type - The workflow type
 * @returns {Object[]} - Array of step objects
 */
const getDefaultWorkflowSteps = (type) => {
  switch (type) {
    case 'property':
      return [
        {
          id: 'info',
          label: 'Property Information',
          description: 'Basic property details and location'
        },
        {
          id: 'characteristics',
          label: 'Property Characteristics',
          description: 'Physical attributes and features'
        },
        {
          id: 'documents',
          label: 'Documents & Photos',
          description: 'Upload relevant files and images'
        },
        {
          id: 'valuation',
          label: 'Valuation',
          description: 'Property value assessment'
        },
        {
          id: 'review',
          label: 'Review & Submit',
          description: 'Final review and confirmation'
        }
      ];
    case 'report':
      return [
        {
          id: 'select-property',
          label: 'Select Property',
          description: 'Choose the property for the report'
        },
        {
          id: 'select-template',
          label: 'Select Template',
          description: 'Choose a report template'
        },
        {
          id: 'gather-data',
          label: 'Data Collection',
          description: 'Collect required data and comparables'
        },
        {
          id: 'analysis',
          label: 'Analysis',
          description: 'Property and market analysis'
        },
        {
          id: 'draft',
          label: 'Draft Report',
          description: 'Generate draft report'
        },
        {
          id: 'review',
          label: 'Review & Edit',
          description: 'Review and make final adjustments'
        },
        {
          id: 'finalize',
          label: 'Finalize & Deliver',
          description: 'Finalize and deliver the report'
        }
      ];
    case 'form':
      return [
        {
          id: 'select-form',
          label: 'Select Form',
          description: 'Choose the form template'
        },
        {
          id: 'property-details',
          label: 'Property Details',
          description: 'Enter property information'
        },
        {
          id: 'inspection',
          label: 'Inspection Notes',
          description: 'Document inspection findings'
        },
        {
          id: 'attachments',
          label: 'Attachments',
          description: 'Add photos and documents'
        },
        {
          id: 'review',
          label: 'Review & Submit',
          description: 'Final review and submission'
        }
      ];
    case 'analysis':
      return [
        {
          id: 'data-selection',
          label: 'Data Selection',
          description: 'Select data sources and parameters'
        },
        {
          id: 'preprocessing',
          label: 'Data Preprocessing',
          description: 'Clean and prepare data'
        },
        {
          id: 'analysis',
          label: 'Analysis',
          description: 'Run analysis algorithms'
        },
        {
          id: 'visualization',
          label: 'Visualization',
          description: 'Generate charts and visualizations'
        },
        {
          id: 'interpret',
          label: 'Interpretation',
          description: 'Interpret and document findings'
        },
        {
          id: 'export',
          label: 'Export Results',
          description: 'Export and share analysis results'
        }
      ];
    default:
      return [
        {
          id: 'step1',
          label: 'Step 1',
          description: 'First step'
        },
        {
          id: 'step2',
          label: 'Step 2',
          description: 'Second step'
        },
        {
          id: 'step3',
          label: 'Step 3',
          description: 'Third step'
        },
        {
          id: 'step4',
          label: 'Step 4',
          description: 'Fourth step'
        }
      ];
  }
};

export default WorkflowProgress;