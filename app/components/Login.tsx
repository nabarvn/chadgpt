"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

const Login = () => {
  return (
    <div
      className='flex flex-col items-center justify-center text-center bg-[#11A37F]'
      style={{ height: "100svh" }}
    >
      <Image
        unoptimized
        src='https://links.papareact.com/2i6'
        width={100}
        height={100}
        alt='ChadGPT Logo'
        className='h-52 w-72'
        priority
      />

      <div className='m-9'>
        <p className='text-5xl text-gray-700 font-extrabold'>ChadGPT</p>
        <p className='text-base text-gray-700 font-bold'>
          (This app may or may not be notable)
        </p>
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className='flex space-x-3 bg-white rounded-lg hover:shadow-lg active:bg-gray-300 p-3'
      >
        <Image
          unoptimized
          src='./google.png'
          width={100}
          height={100}
          alt='Google Logo'
          className='h-9 w-9'
          priority
        />
        <p className='text-[#757575] text-2xl font-semibold pr-1.5'>
          Sign in with Google
        </p>
      </button>
    </div>
  );
};

export default Login;
