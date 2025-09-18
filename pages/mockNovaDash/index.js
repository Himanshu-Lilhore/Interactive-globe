import GlobeV3 from "@/components/GlobeV3";
import starBg from "../../public/images/starBg.png";
import dummyOnboarding from "../../public/images/dummyOnboarding.png";
import Image from "next/image";

const Home = () => {
    return (
        <div className="relative bg-black flex h-screen w-full p-[0.83vw] gap-[0.83vw] [&>*]:rounded-[0.8vw]">
            <div className="flex-1 bg-white h-full relative overflow-hidden">
                <Image
                    src={dummyOnboarding}
                    className="w-full h-full z-10"
                    fill
                    alt="onboarding-image"
                />
            </div>
            <div className="flex-1 h-full relative border-[#2F2F2F] border-[0.15vw] overflow-hidden">
                <Image
                    src={starBg}
                    className="object-cover w-full h-full z-10"
                    fill
                    alt="bg-image"
                />
                <div className="z-20 absolute top-0 left-0 h-full w-full bg-gradient-to-tl from-[#ED9C0022] to-transparent"></div>
                <div className="relative flex flex-col z-40 text-[#FFFFFF] w-full p-[2.78vw] gap-[0.83vw] font-host-grotesk">
                    <div className="text-[2.2vw] font-semibold">Your Success Story Starts Here</div>
                    <div className="text-[1.11vw] font-medium">
                        Get expert guidance to achieve admits you once only dreamed of
                    </div>
                    <div className="flex gap-[0.6vw] h-[0.6vw] mt-[0.7vw]">
                        <div className="w-[2.2vw] bg-white rounded-full"></div>
                        <div className="w-[0.9vw] bg-white/60 rounded-full"></div>
                        <div className="w-[0.9vw] bg-white/60 rounded-full"></div>
                    </div>
                </div>

                <div className="z-30 absolute h-full w-full left-[-82%] p-5 scale-[104%] fade-up">
                    <GlobeV3 />
                </div>
            </div>
        </div>
    );
};

export default Home;
