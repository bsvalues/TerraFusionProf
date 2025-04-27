/**
 * TerraFusionPro - useWorkflow Hook
 * Custom hook for managing workflow state and progression
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '../components/layout/NotificationCenter';

/**
 * Custom hook for managing multi-step workflows
 * @param {Object} options - Workflow configuration
 * @param {string} options.name - Workflow name
 * @param {Array} options.steps - Array of workflow steps
 * @param {number} options.initialStep - Initial step index (default: 0)
 * @param {function} options.onComplete - Callback when workflow completes
 * @param {function} options.validateStep - Function to validate current step
 * @param {Object} options.data - Initial workflow data
 * @returns {Object} - Workflow state and control functions
 */
const useWorkflow = ({
  name,
  steps,
  initialStep = 0,
  onComplete,
  validateStep,
  data: initialData = {}
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [data, setData] = useState(initialData);
  const [stepHistory, setStepHistory] = useState([initialStep]);
  const [isComplete, setIsComplete] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  
  // Get current step object
  const currentStep = steps[currentStepIndex] || {};
  
  // Calculate progress percentage
  const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);
  
  /**
   * Update workflow data
   * @param {Object|function} newData - Data to merge or function to update data
   */
  const updateData = (newData) => {
    if (typeof newData === 'function') {
      setData(prevData => ({
        ...prevData,
        ...newData(prevData)
      }));
    } else {
      setData(prevData => ({
        ...prevData,
        ...newData
      }));
    }
  };
  
  /**
   * Validate the current step
   * @returns {boolean} - Whether the step is valid
   */
  const validateCurrentStep = async () => {
    // No validation function provided
    if (!validateStep) return true;
    
    try {
      const result = await validateStep(currentStep, data);
      
      if (result === true) {
        // Valid
        setIsValid(true);
        setValidationErrors({});
        return true;
      } else {
        // Invalid with errors
        setIsValid(false);
        setValidationErrors(result || {});
        return false;
      }
    } catch (error) {
      console.error('Error validating step:', error);
      setIsValid(false);
      setValidationErrors({ _error: error.message });
      return false;
    }
  };
  
  /**
   * Move to the next step
   * @returns {boolean} - Whether the navigation was successful
   */
  const nextStep = async () => {
    // Validate current step before proceeding
    const isStepValid = await validateCurrentStep();
    
    if (!isStepValid) {
      notifications.error('Please correct the errors before continuing.', {
        title: 'Validation Error'
      });
      return false;
    }
    
    // Check if we're on the last step
    if (currentStepIndex >= steps.length - 1) {
      return completeWorkflow();
    }
    
    // Move to next step
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    
    // Add to step history
    setStepHistory(prev => [...prev, nextIndex]);
    
    return true;
  };
  
  /**
   * Move to the previous step
   * @returns {boolean} - Whether the navigation was successful
   */
  const prevStep = () => {
    if (currentStepIndex <= 0) return false;
    
    // Move to previous step
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    
    return true;
  };
  
  /**
   * Jump to a specific step
   * @param {number} index - Step index to jump to
   * @returns {boolean} - Whether the navigation was successful
   */
  const goToStep = async (index) => {
    // Can't go beyond bounds
    if (index < 0 || index >= steps.length) return false;
    
    // If going forward, validate all steps in between
    if (index > currentStepIndex) {
      const isStepValid = await validateCurrentStep();
      
      if (!isStepValid) {
        notifications.error('Please correct the errors before continuing.', {
          title: 'Validation Error'
        });
        return false;
      }
    }
    
    setCurrentStepIndex(index);
    
    // Add to history if going forward
    if (index > Math.max(...stepHistory)) {
      setStepHistory(prev => [...prev, index]);
    }
    
    return true;
  };
  
  /**
   * Complete the workflow
   * @returns {boolean} - Whether completion was successful
   */
  const completeWorkflow = async () => {
    // Validate final step
    const isStepValid = await validateCurrentStep();
    
    if (!isStepValid) {
      notifications.error('Please correct the errors before completing.', {
        title: 'Validation Error'
      });
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call completion handler if provided
      if (onComplete) {
        await onComplete(data);
      }
      
      setIsComplete(true);
      
      notifications.success(`${name} workflow completed successfully!`, {
        title: 'Workflow Complete'
      });
      
      return true;
    } catch (error) {
      console.error('Error completing workflow:', error);
      
      notifications.error(error.message || 'Failed to complete workflow.', {
        title: 'Completion Error'
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Reset the workflow to initial state
   */
  const resetWorkflow = () => {
    setCurrentStepIndex(initialStep);
    setData(initialData);
    setStepHistory([initialStep]);
    setIsComplete(false);
    setIsValid(true);
    setValidationErrors({});
  };
  
  /**
   * Check if a step has been visited
   * @param {number} index - Step index to check
   * @returns {boolean} - Whether the step has been visited
   */
  const isStepVisited = (index) => {
    return stepHistory.includes(index);
  };
  
  // Return workflow state and control functions
  return {
    // State
    currentStep,
    currentStepIndex,
    steps,
    data,
    progress,
    isComplete,
    isValid,
    validationErrors,
    isSubmitting,
    
    // Navigation
    nextStep,
    prevStep,
    goToStep,
    
    // Data management
    updateData,
    
    // Workflow control
    completeWorkflow,
    resetWorkflow,
    validateCurrentStep,
    isStepVisited
  };
};

export default useWorkflow;