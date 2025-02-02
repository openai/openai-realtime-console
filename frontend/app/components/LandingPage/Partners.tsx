import Image from "next/image";
import Link from "next/link";

const IMAGE_SIZE = 150;
const Partners = () => {
    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex flex-row w-full gap-10 items-center justify-center opacity-30">
                <Link
                    href="https://antler.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="origin"
                >
                    <Image
                        src={"/antler.png"}
                        width={IMAGE_SIZE}
                        height={IMAGE_SIZE}
                        alt="antler"
                        style={{
                            WebkitFilter:
                                "grayscale(100%)" /* Safari 6.0 - 9.0 */,
                            filter: "grayscale(100%)",
                        }}
                    />
                </Link>

                {/* <Separator
                    className="border-2 text-gray-500 flex-grow"
                    orientation="vertical"
                /> */}
                <Link
                    href="https://microsoft.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="origin"
                >
                    <Image
                        src={"/microsoft.png"}
                        width={IMAGE_SIZE}
                        height={IMAGE_SIZE}
                        alt={"microsoft"}
                        style={{
                            WebkitFilter:
                                "grayscale(100%)" /* Safari 6.0 - 9.0 */,
                            filter: "grayscale(100%)",
                        }}
                    />
                </Link>
            </div>
            <div className="text-xs hidden sm:block text-gray-500">
                Supported by our proud partners
            </div>
        </div>
    );
};

export default Partners;
