"use client";

interface LeftPanelProps {
  type: "login" | "signup";
}

export default function LeftPanel({ type }: LeftPanelProps) {
  const isLogin = type === "login";

  return (
    <div className="relative hidden md:flex md:w-1/2 bg-transparent p-8 flex-col justify-between">
      <div className="text-white">
        <div className="text-semibold text-xl font-light flex items-center gap-2">
          <span className="uppercase tracking-widest">
            AI-based management app
          </span>
          <div className="grow border-b border-white/50"></div>
        </div>
        <p className="text-sm italic text-white mt-2"></p>
      </div>
      <div className="text-white">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-medium mb-2 leading-tight text-nowrap">
          AI-based management app
        </h1>
        <p className="text-lg font-light max-w-sm">
          Manage your projects with AI assistance
        </p>
      </div>
    </div>
  );
}
