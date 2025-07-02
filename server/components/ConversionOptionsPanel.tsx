import React from 'react';
import { ConversionOption, ConversionOptionChoice } from '../types';
import { Info, AlertTriangle } from 'lucide-react';

interface ConversionOptionsPanelProps {
  options: ConversionOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optionValues: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOptionChange: (optionId: string, value: any) => void;
}

const InputField: React.FC<{option: ConversionOption, value: any, onChange: (value: any) => void}> = ({ option, value, onChange }) => {
  switch (option.type) {
    case 'select':
      return (
        <select
          id={option.id}
          value={value ?? option.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          {option.choices?.map((choice: ConversionOptionChoice) => (
            <option key={choice.value.toString()} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <div className="flex items-center mt-1">
          <input
            id={option.id}
            type="checkbox"
            checked={value ?? option.defaultValue ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-primary border-neutral-300 dark:border-neutral-600 rounded focus:ring-primary"
          />
           <label htmlFor={option.id} className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
            {option.label}
          </label>
        </div>
      );
    case 'number':
      return (
        <input
          id={option.id}
          type="number"
          value={value ?? option.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          min={option.min}
          max={option.max}
          step={option.step}
          placeholder={option.placeholder}
          className="mt-1 block w-full shadow-sm sm:text-sm border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-md p-2 focus:ring-primary focus:border-primary"
        />
      );
    case 'text':
    case 'password':
      return (
        <input
          id={option.id}
          type={option.type}
          value={value ?? option.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={option.placeholder}
          className="mt-1 block w-full shadow-sm sm:text-sm border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-md p-2 focus:ring-primary focus:border-primary"
        />
      );
    case 'radio':
        return (
            <div className="mt-1 space-y-2">
                {option.choices?.map((choice) => (
                    <div key={choice.value.toString()} className="flex items-center">
                        <input
                            id={`${option.id}-${choice.value}`}
                            name={option.id}
                            type="radio"
                            value={choice.value}
                            checked={(value ?? option.defaultValue) === choice.value}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-4 w-4 text-primary border-neutral-300 dark:border-neutral-600 focus:ring-primary"
                        />
                        <label htmlFor={`${option.id}-${choice.value}`} className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                            {choice.label}
                        </label>
                    </div>
                ))}
            </div>
        );
    default:
      return null;
  }
};

const ConversionOptionsPanel: React.FC<ConversionOptionsPanelProps> = ({ options, optionValues, onOptionChange }) => {
  if (!options || options.length === 0) {
    return null; // No options to display
  }

  // Check if text-based conversion is selected for PDF to PowerPoint
  const isTextBasedConversion = optionValues.conversionType === 'text';

  return (
    <div className="mt-6 p-6 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Conversion Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((option) => (
          <div key={option.id} className={option.type === 'checkbox' ? 'md:col-span-2 flex items-center' : ''}>
            {option.type !== 'checkbox' && (
                <label htmlFor={option.id} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {option.label}
                </label>
            )}
            <InputField 
                option={option} 
                value={optionValues[option.id]}
                onChange={(value) => onOptionChange(option.id, value)}
            />
            {option.info && !option.error && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 flex items-start">
                <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>{option.info}</span>
              </p>
            )}
            {option.error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>{option.error}</span>
              </p>
            )}
            
            {/* Custom warning for PDF to PowerPoint text-based conversion */}
            {option.id === 'conversionType' && isTextBasedConversion && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-yellow-700">
                      <strong>Warning:</strong> No images will be extracted and the original document structure may be broken. 
                      This method only extracts text content and creates simple text slides.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionOptionsPanel;
    