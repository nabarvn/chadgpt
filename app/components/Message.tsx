import { DocumentData } from "firebase/firestore";

type Props = {
  message: DocumentData;
};

const Message = ({ message }: Props) => {
  const isChad = message.user.name === "Chad";

  return (
    <div className={`text-white ${isChad && "bg-[#434654]"} py-5`}>
      <div className='flex max-w-2xl mx-auto space-x-5 px-10'>
        <img
          src={message.user.avatar}
          alt='avatar'
          className='h-7 w-7 shrink-0 object-cover pt-1'
        />
        <p className='text-sm whitespace-pre-wrap'>
          {message.text.trimStart()}
        </p>
      </div>
    </div>
  );
};

export default Message;
