"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

const SignIn = () => {
  return (
    <div
      className='flex flex-col items-center justify-center text-center bg-[#11A37F]'
      style={{ height: "100svh" }}
    >
      <Image
        priority
        unoptimized
        src='/loginPageLogo.png'
        width={25}
        height={25}
        alt='ChadGPT Logo'
        className='h-52 w-auto lg:h-40 lg:w-auto xl:h-52 xl:w-72'
      />

      <div className='mb-7 lg:mb-5 xl:mb-9'>
        <p className='text-5xl lg:text-3xl xl:text-5xl text-gray-700 font-extrabold'>
          ChadGPT
        </p>
        <p className='text-sm lg:text-xs xl:text-base text-gray-700 font-bold'>
          (This app may or may not be notable)
        </p>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className='flex space-x-3 lg:space-x-1 xl:space-x-3 bg-white items-center justify-center rounded-3xl lg:rounded-lg xl:rounded-2xl hover:shadow-lg active:bg-gray-300 p-3 lg:p-1 xl:p-3'
      >
        <Image
          unoptimized
          src='/google.png'
          width={25}
          height={25}
          alt='Google Logo'
          className='h-7 w-7 xl:h-10 xl:w-10 xl:mt-1'
        />
        <p className='text-[#757575] text-base lg:text-sm xl:text-2xl font-semibold pr-1 lg:pr-1.5'>
          Sign in with Google
        </p>
      </button>
    </div>
  );
};

export default SignIn;
