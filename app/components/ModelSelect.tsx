"use client";

import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";
import useSWR from "swr";

const fetchModels = () => fetch("/api/models").then((res) => res.json());

interface Option {
  value: string;
  label: string;
}

type Props = {
  defaultValue: string;
};

const ModelSelect = ({ defaultValue }: Props) => {
  const { data: models, isLoading } = useSWR("models", fetchModels);

  const { data: model, mutate: setModel } = useSWR("model", {
    fallbackData: defaultValue,
  });

  return (
    <Listbox value={model} onChange={setModel}>
      <div className='relative'>
        <Listbox.Button className='relative w-full cursor-pointer rounded-lg bg-[#434654] py-3 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:text-sm'>
          <span className='block text-gray-300 truncate'>{model}</span>

          <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
            <ChevronUpDownIcon
              className='h-5 w-5 text-gray-300'
              aria-hidden='true'
            />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave='transition ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <Listbox.Options className='absolute mt-1 z-50 max-h-60 w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-md rounded-md bg-[#434654] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
            {models?.modelOptions.map((model: Option, i: number) => (
              <Listbox.Option
                key={i}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                    active ? "bg-[#343541] text-[#11A37F]" : "text-gray-900"
                  }`
                }
                value={model.value}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate text-gray-300 ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {model.label}
                    </span>

                    {selected ? (
                      <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-[#11A37F]'>
                        <CheckIcon className='h-5 w-5' aria-hidden='true' />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

export default ModelSelect;
