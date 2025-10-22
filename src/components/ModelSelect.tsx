"use client";

import useSWR from "swr";
import { Fragment, useMemo, useCallback } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";

const CONSTANTS = {
  DEFAULT_MODEL: "gpt-3.5-turbo",
  SWR_KEY: "model",
  TRANSITION_DURATION: 100,
};

const AVAILABLE_MODELS = [
  {
    value: "gpt-3.5-turbo",
    label: "GPT-3.5 Turbo",
    description: "Fast and efficient for most tasks",
  },
  {
    value: "gpt-4.1-nano",
    label: "GPT-4.1 Nano",
    description: "Latest model with enhanced capabilities",
  },
] as const;

interface ModelOption {
  value: string;
  label: string;
  description?: string;
}

interface ModelSelectProps {
  defaultValue: string;
  onModelChange?: (model: string) => void;
  disabled?: boolean;
  className?: string;
}

interface ModelValidation {
  isValid: boolean;
  error?: string;
}

function validateModel(model: string): ModelValidation {
  if (!model || typeof model !== "string") {
    return { isValid: false, error: "Invalid model selected" };
  }

  const isValidModel = AVAILABLE_MODELS.some(
    (availableModel) => availableModel.value === model,
  );

  if (!isValidModel) {
    return { isValid: false, error: "Invalid model selected" };
  }

  return { isValid: true };
}

function getModelLabel(modelValue: string): string {
  const model = AVAILABLE_MODELS.find((m) => m.value === modelValue);
  return model?.label || modelValue;
}

function getDefaultModel(defaultValue: string): string {
  const validation = validateModel(defaultValue);
  return validation.isValid ? defaultValue : CONSTANTS.DEFAULT_MODEL;
}

const ModelSelectButton = ({ model }: { model: string }) => {
  const modelLabel = useMemo(() => getModelLabel(model), [model]);

  return (
    <Listbox.Button
      className="relative w-full cursor-pointer rounded-lg bg-[#434654] py-3 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
      aria-label={`Current model: ${modelLabel}`}
    >
      <span className="block truncate text-gray-300">{modelLabel}</span>

      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <ChevronUpDownIcon
          className="h-5 w-5 text-gray-300"
          aria-hidden="true"
        />
      </span>
    </Listbox.Button>
  );
};

const ModelOption = ({
  option,
  selected,
}: {
  option: ModelOption;
  selected: boolean;
}) => (
  <>
    <span
      className={`block truncate text-gray-300 ${
        selected ? "font-medium" : "font-normal"
      }`}
    >
      {option.label}
    </span>

    {option.description && (
      <span className="mt-1 block truncate text-xs text-gray-400">
        {option.description}
      </span>
    )}

    {selected && (
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#11A37F]">
        <CheckIcon className="h-5 w-5" aria-hidden="true" />
      </span>
    )}
  </>
);

const ModelSelect = ({
  defaultValue,
  onModelChange,
  disabled = false,
  className = "",
}: ModelSelectProps) => {
  const validatedDefaultValue = useMemo(
    () => getDefaultModel(defaultValue),
    [defaultValue],
  );

  const { data: model, mutate: setModel } = useSWR(CONSTANTS.SWR_KEY, {
    fallbackData: validatedDefaultValue,
  });

  const currentModel = useMemo(() => {
    const validation = validateModel(model);
    return validation.isValid ? model : CONSTANTS.DEFAULT_MODEL;
  }, [model]);

  const handleModelChange = useCallback(
    async (newModel: string) => {
      const validation = validateModel(newModel);

      if (!validation.isValid) {
        console.error("ModelSelect: Invalid model selected:", {
          model: newModel,
          error: validation.error,
          timestamp: new Date().toISOString(),
        });

        return;
      }

      try {
        await setModel(newModel, { revalidate: false });
        onModelChange?.(newModel);
      } catch (error) {
        console.error("ModelSelect: Failed to update model:", {
          error: error instanceof Error ? error.message : "Unknown error",
          newModel,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [setModel, onModelChange],
  );

  const availableModels = useMemo(() => AVAILABLE_MODELS, []);

  return (
    <div className={`relative ${className}`}>
      <Listbox
        value={currentModel}
        onChange={handleModelChange}
        disabled={disabled}
      >
        <ModelSelectButton model={currentModel} />

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#434654] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 scrollbar-thumb-rounded-md focus:outline-none sm:text-sm"
            aria-label="Model selection options"
          >
            {availableModels.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                    active ? "bg-[#343541] text-[#11A37F]" : "text-gray-900"
                  }`
                }
                value={option.value}
                aria-label={`Select ${option.label}`}
              >
                {({ selected }) => (
                  <ModelOption option={option} selected={selected} />
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  );
};

export default ModelSelect;
