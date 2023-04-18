"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

const Login = () => {
  return (
    <div className='flex flex-col items-center justify-center text-center bg-[#11A37F] min-h-screen'>
      <Image
        unoptimized
        src='https://links.papareact.com/2i6'
        width={100}
        height={100}
        alt='ChadGPT Logo'
        className='h-52 w-72'
        priority
      />

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className='text-white text-3xl font-bold'
      >
        Sign In to use ChadGPT
      </button>
    </div>
  );
};

export default Login;
