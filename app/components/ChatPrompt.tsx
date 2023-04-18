"use client";

import { db } from "@/firebase/firebase";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { FormEvent, KeyboardEvent, useState } from "react";
import { toast } from "react-hot-toast";
// import ModelSelect from "./ModelSelect";
// import useSWR from "swr";

type Props = {
  chatId: string;
};

const ChatPrompt = ({ chatId }: Props) => {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");

  // useSWR to get model
  //   const { data: model } = useSWR("model", {
  //     fallbackData: "text-davinci-003",
  //   });

  const model = "text-davinci-003";

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt) return;

    const input = prompt.trim();

    if (input === "") return;

    setPrompt("");

    const message: Message = {
      text: input,
      createdAt: serverTimestamp(),
      user: {
        _id: session?.user?.email,
        name: session?.user?.name,
        avatar:
          session?.user?.image ||
          `https://ui-avatars.com/api/?name=${session?.user?.name}`,
      },
    };

    await addDoc(
      collection(
        db,
        "users",
        session?.user?.email!,
        "chats",
        chatId,
        "messages"
      ),
      message
    );

    //Toast Notification while processing...
    const notification = toast.loading("Chad is processing...");

    await fetch("/api/prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input,
        chatId,
        model,
        session,
      }),
    }).then(() => {
      // Toast notification when successful!
      toast.success("Chad has responded!", {
        id: notification,
      });
    });
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      sendMessage(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className='bg-gray-700/50 text-gray-400 rounded-lg text-sm'>
      <form onSubmit={sendMessage} className='flex space-x-5 p-3'>
        <textarea
          name='prompt'
          autoComplete='off'
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!session}
          className='flex-1 bg-transparent focus:outline-none disabled:cursor-not-allowed disabled:text-gray-300 overflow-y-auto resize-none scrollbar-thin scrollbar-thumb-slate-50 scrollbar-track-rounded-lg'
          placeholder='Get prompting already!'
          onKeyUp={handleKeyUp}
        />

        <button
          type='submit'
          disabled={!prompt || !session}
          className='bg-[#11A37F] hover:opacity-50 text-white disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:opacity-100 font-bold rounded px-3 py-2 max-h-7'
        >
          <PaperAirplaneIcon className='h-3 w-3 -rotate-45' />
        </button>
      </form>

      {/* <div className='md:hidden z-10'>
        <ModelSelect defaultValue='text-davinci-003' />
      </div> */}
    </div>
  );
};

export default ChatPrompt;
