import Image from "next/image";

export function LogoMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Image
      src="/strand/logo-mark.svg"
      alt="TwelveLabs"
      width={16}
      height={16}
      className={className}
    />
  );
}
